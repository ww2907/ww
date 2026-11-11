package com.fenglin.springboottest.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.entity.Category;
import com.fenglin.springboottest.entity.Dish;
import com.fenglin.springboottest.entity.Restaurant;
import com.fenglin.springboottest.entity.Review;
import com.fenglin.springboottest.mapper.CategoryMapper;
import com.fenglin.springboottest.mapper.DishMapper;
import com.fenglin.springboottest.mapper.RestaurantMapper;
import com.fenglin.springboottest.mapper.ReviewMapper;
import com.fenglin.springboottest.service.RestaurantService;
import com.fenglin.springboottest.vo.CategoryTreeVO;
import com.fenglin.springboottest.vo.DishSpecOptionVO;
import com.fenglin.springboottest.vo.DishSpecVO;
import com.fenglin.springboottest.vo.DishVO;
import com.fenglin.springboottest.vo.RestaurantDetailVO;
import com.fenglin.springboottest.vo.RestaurantVO;
import com.fenglin.springboottest.vo.ReviewVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RestaurantServiceImpl extends ServiceImpl<RestaurantMapper, Restaurant> implements RestaurantService {

    /** 无菜品时的「人均」分类基准价（与前端 src/api/food.js 的 PRICE_BASE 保持一致） */
    private static final Map<String, Integer> PRICE_BASE = new HashMap<>();

    static {
        PRICE_BASE.put("面食", 22);
        PRICE_BASE.put("快餐", 26);
        PRICE_BASE.put("甜点", 24);
        PRICE_BASE.put("饮品", 20);
        PRICE_BASE.put("轻食", 26);
        PRICE_BASE.put("火锅", 58);
    }

    /** 距离文案解析："320m" -> 320；"1.1km" -> 1100 */
    private static final Pattern DISTANCE_PATTERN = Pattern.compile("([\\d.]+)\\s*(km|公里|m|米)?");

    /** 规格 JSON 解析器（dish.specs -> List<DishSpecVO>） */
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final DishMapper dishMapper;
    private final ReviewMapper reviewMapper;
    private final CategoryMapper categoryMapper;

    public RestaurantServiceImpl(DishMapper dishMapper, ReviewMapper reviewMapper, CategoryMapper categoryMapper) {
        this.dishMapper = dishMapper;
        this.reviewMapper = reviewMapper;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<RestaurantVO> search(String keyword, String category) {
        return search(keyword, category, null, null);
    }

    @Override
    public List<RestaurantVO> search(String keyword, String category, String sort, String order) {
        return doSearch(keyword, null, category, sort, order);
    }

    @Override
    public List<RestaurantVO> search(String keyword, Long categoryId, String sort, String order) {
        return doSearch(keyword, categoryId, null, sort, order);
    }

    /**
     * 首页 / 通用搜索的统一实现。
     * 分类既能按 id（推荐，走 path 子树 + dish 反查），也能按名称（兼容旧链接）。
     */
    private List<RestaurantVO> doSearch(String keyword, Long categoryId, String categoryName,
                                        String sort, String order) {
        QueryWrapper<Restaurant> qw = new QueryWrapper<>();

        // 关键字：匹配店名 / 简介 / 标签
        if (keyword != null && !keyword.trim().isEmpty()) {
            String k = keyword.trim();
            qw.and(w -> w.like("name", k).or().like("description", k).or().like("tags", k));
        }

        // 分级分类搜索：categoryId 命中整棵子树；为空表示不限分类
        List<Long> catIds = resolveSubtreeIds(categoryId, categoryName);
        if (catIds != null) {
            if (catIds.isEmpty()) {
                // 分类表里查不到这个名字：退回按店铺 cat 字段精确匹配（兼容历史调用）
                if (categoryName == null || categoryName.trim().isEmpty()) {
                    return new ArrayList<>();
                }
                qw.eq("cat", categoryName.trim());
            } else {
                // 店铺自身挂二级业态；选到三级品类时，靠 dish.category_id 反查有该菜品的店铺
                String inIds = joinIds(catIds);
                qw.and(w -> w.in("category_id", catIds).or()
                        .apply("EXISTS (SELECT 1 FROM dish d WHERE d.restaurant_id = restaurant.id"
                                + " AND d.category_id IN (" + inIds + "))"));
            }
        }

        qw.orderByDesc("sort");
        Map<Long, Integer> priceMap = avgPriceByRestaurant();
        List<RestaurantVO> list = baseMapper.selectList(qw).stream()
                .map(r -> toVO(r, priceMap))
                .collect(Collectors.toList());
        return applySort(list, sort, order);
    }

    @Override
    public List<RestaurantVO> recommended(int limit) {
        if (limit <= 0) {
            limit = 12;
        }
        Map<Long, Integer> priceMap = avgPriceByRestaurant();
        return topRated(limit).stream().map(r -> toVO(r, priceMap)).collect(Collectors.toList());
    }

    @Override
    public List<RestaurantVO> foodList(String keyword, String category) {
        return foodList(keyword, category, null, null);
    }

    @Override
    public List<RestaurantVO> foodList(String keyword, String category, String sort, String order) {
        return doFoodList(keyword, null, category, sort, order);
    }

    @Override
    public List<RestaurantVO> foodList(String keyword, Long categoryId, String sort, String order) {
        return doFoodList(keyword, categoryId, null, sort, order);
    }

    private List<RestaurantVO> doFoodList(String keyword, Long categoryId, String categoryName,
                                          String sort, String order) {
        List<Restaurant> all = baseMapper.selectList(null);

        // 与 recommended 共用口径：评分最高的 12 家作为「推荐集」，从美食页中剔除
        Set<Long> recommendedIds = topRated(12).stream()
                .map(Restaurant::getId)
                .collect(Collectors.toSet());

        // 关键字：匹配店名 / 简介 / 标签
        String k = (keyword == null) ? null : keyword.trim();

        // 分级分类：按 id 解析整棵子树；同时取出「有该子树品类菜品的店铺 id 集合」
        List<Long> catIds = resolveSubtreeIds(categoryId, categoryName);
        Set<Long> catIdsSet = (catIds == null) ? null : new HashSet<>(catIds);
        Set<Long> dishHitRestIds = (catIds == null) ? null : restaurantIdsByDishCategory(catIds);
        boolean legacyByName = catIds != null && catIds.isEmpty()
                && categoryName != null && !categoryName.trim().isEmpty();

        Map<Long, Integer> priceMap = avgPriceByRestaurant();
        List<RestaurantVO> list = all.stream()
                .filter(r -> !recommendedIds.contains(r.getId()))
                .filter(r -> matchKeyword(r, k))
                .filter(r -> catIdsSet == null
                        || (legacyByName && categoryName.trim().equals(r.getCat()))
                        || catIdsSet.contains(r.getCategoryId())
                        || dishHitRestIds.contains(r.getId()))
                .sorted((a, b) -> compareSortDesc(a, b))
                .map(r -> toVO(r, priceMap))
                .collect(Collectors.toList());
        return applySort(list, sort, order);
    }

    /**
     * 统一排序：comprehensive / price / distance。
     * 与前端 FoodView 的 sorted computed 口径保持一致，
     * 保证「后端已排序」与「前端兜底重排」结果完全相同。
     */
    private List<RestaurantVO> applySort(List<RestaurantVO> list, String sort, String order) {
        String field = (sort == null || sort.trim().isEmpty()) ? SORT_DEFAULT : sort.trim().toLowerCase();
        boolean desc = order != null && "desc".equalsIgnoreCase(order.trim());
        Comparator<RestaurantVO> cmp;
        switch (field) {
            case SORT_PRICE:
                // 价格优先，价格相同按评分降序，再按 id 保证稳定
                cmp = Comparator
                        .comparingInt((RestaurantVO v) -> v.getPrice() == null ? Integer.MAX_VALUE : v.getPrice())
                        .thenComparing(Comparator.comparingDouble(
                                (RestaurantVO v) -> v.getRating() == null ? 0.0 : v.getRating()).reversed())
                        .thenComparing(v -> v.getId() == null ? 0L : v.getId());
                break;
            case SORT_DISTANCE:
                cmp = Comparator
                        .comparingInt((RestaurantVO v) -> v.getDistanceM() == null ? Integer.MAX_VALUE : v.getDistanceM())
                        .thenComparing(Comparator.comparingDouble(
                                (RestaurantVO v) -> v.getRating() == null ? 0.0 : v.getRating()).reversed())
                        .thenComparing(v -> v.getId() == null ? 0L : v.getId());
                break;
            case SORT_DEFAULT:
            default:
                // 综合：评分降序 → 距离升序 → id
                cmp = Comparator
                        .comparingDouble((RestaurantVO v) -> v.getRating() == null ? 0.0 : v.getRating())
                        .reversed()
                        .thenComparingInt(v -> v.getDistanceM() == null ? Integer.MAX_VALUE : v.getDistanceM())
                        .thenComparing(v -> v.getId() == null ? 0L : v.getId());
                break;
        }
        List<RestaurantVO> sorted = new ArrayList<>(list);
        sorted.sort(desc ? cmp.reversed() : cmp);
        return sorted;
    }

    /** 取评分最高的 n 家（评分相同按 id 升序，评分缺失的排到最后） */
    private List<Restaurant> topRated(int n) {
        return baseMapper.selectList(null).stream()
                .sorted(this::compareRatingDesc)
                .limit(n)
                .collect(Collectors.toList());
    }

    private int compareRatingDesc(Restaurant a, Restaurant b) {
        BigDecimal ra = a.getRating();
        BigDecimal rb = b.getRating();
        if (ra == null && rb == null) {
            return Long.compare(a.getId(), b.getId());
        }
        if (ra == null) {
            return 1; // 评分缺失排后
        }
        if (rb == null) {
            return -1;
        }
        int c = rb.compareTo(ra); // 降序
        return c != 0 ? c : Long.compare(a.getId(), b.getId());
    }

    private int compareSortDesc(Restaurant a, Restaurant b) {
        Integer sa = a.getSort();
        Integer sb = b.getSort();
        if (sa == null && sb == null) {
            return Long.compare(a.getId(), b.getId());
        }
        if (sa == null) {
            return 1;
        }
        if (sb == null) {
            return -1;
        }
        int c = sb.compareTo(sa); // 降序
        return c != 0 ? c : Long.compare(a.getId(), b.getId());
    }

    private boolean matchKeyword(Restaurant r, String k) {
        if (k == null || k.isEmpty()) {
            return true;
        }
        return (r.getName() != null && r.getName().contains(k))
                || (r.getDescription() != null && r.getDescription().contains(k))
                || (r.getTags() != null && r.getTags().contains(k));
    }

    @Override
    public List<String> categories() {
        // 兼容旧调用：只返回二级业态名称（一级「美食」固定在最前由前端补）
        List<Category> all = categoryMapper.selectList(
                new QueryWrapper<Category>().eq("level", 2).eq("enabled", 1)
                        .orderByAsc("sort_order").orderByAsc("id"));
        List<String> result = new ArrayList<>();
        result.add("全部");
        for (Category c : all) {
            result.add(c.getName());
        }
        return result;
    }

    @Override
    public List<CategoryTreeVO> categoryTree() {
        List<Category> all = categoryMapper.selectList(
                new QueryWrapper<Category>().eq("enabled", 1)
                        .orderByAsc("level").orderByAsc("sort_order").orderByAsc("id"));

        // 口径：店铺挂二级业态 → 直接计数；菜品挂三级品类 → 有该菜品的店铺也算命中该品类
        Map<Long, Set<Long>> restIdsByCat = new HashMap<>();
        for (Restaurant r : baseMapper.selectList(null)) {
            if (r.getCategoryId() != null) {
                restIdsByCat.computeIfAbsent(r.getCategoryId(), x -> new HashSet<>()).add(r.getId());
            }
        }
        Map<Long, Integer> dishCountByCat = new HashMap<>();
        List<Dish> dishes = dishMapper.selectList(
                new QueryWrapper<Dish>().select("id", "restaurant_id", "category_id"));
        for (Dish d : dishes) {
            if (d.getCategoryId() == null) {
                continue;
            }
            dishCountByCat.merge(d.getCategoryId(), 1, Integer::sum);
            if (d.getRestaurantId() != null) {
                restIdsByCat.computeIfAbsent(d.getCategoryId(), x -> new HashSet<>()).add(d.getRestaurantId());
            }
        }

        // 建节点并挂父子关系
        Map<Long, CategoryTreeVO> voMap = new LinkedHashMap<>();
        for (Category c : all) {
            CategoryTreeVO vo = new CategoryTreeVO();
            vo.setId(c.getId());
            vo.setName(c.getName());
            vo.setLevel(c.getLevel());
            vo.setPath(c.getPath());
            vo.setCode(c.getCode());
            vo.setIcon(c.getIcon());
            vo.setSortOrder(c.getSortOrder());
            vo.setRestaurantCount(0);
            vo.setDishCount(0);
            voMap.put(c.getId(), vo);
        }
        List<CategoryTreeVO> roots = new ArrayList<>();
        for (Category c : all) {
            CategoryTreeVO vo = voMap.get(c.getId());
            Long pid = (c.getParentId() == null) ? 0L : c.getParentId();
            CategoryTreeVO parent = voMap.get(pid);
            if (parent != null) {
                parent.getChildren().add(vo);
            } else {
                roots.add(vo);
            }
        }

        // 自底向上汇总：按 level 倒序处理，保证子节点先算完
        List<Category> byLevelDesc = new ArrayList<>(all);
        byLevelDesc.sort((a, b) -> Integer.compare(
                b.getLevel() == null ? 0 : b.getLevel(),
                a.getLevel() == null ? 0 : a.getLevel()));
        Map<Long, Set<Long>> accRest = new HashMap<>();
        Map<Long, Integer> accDish = new HashMap<>();
        for (Category c : byLevelDesc) {
            CategoryTreeVO vo = voMap.get(c.getId());
            Set<Long> restSet = new HashSet<>(restIdsByCat.getOrDefault(c.getId(), Collections.emptySet()));
            int dish = dishCountByCat.getOrDefault(c.getId(), 0);
            for (CategoryTreeVO child : vo.getChildren()) {
                restSet.addAll(accRest.getOrDefault(child.getId(), Collections.emptySet()));
                dish += accDish.getOrDefault(child.getId(), 0);
            }
            accRest.put(c.getId(), restSet);
            accDish.put(c.getId(), dish);
            vo.setRestaurantCount(restSet.size());
            vo.setDishCount(dish);
        }
        return roots;
    }

    @Override
    public RestaurantDetailVO detail(Long id) {
        Restaurant r = baseMapper.selectById(id);
        if (r == null) {
            throw new BusinessException(404, "店铺不存在");
        }
        RestaurantDetailVO vo = new RestaurantDetailVO();
        copyBase(r, vo);

        List<Dish> dishes = dishMapper.selectList(
                new QueryWrapper<Dish>().eq("restaurant_id", id).orderByAsc("sort"));
        vo.setMenu(dishes.stream().map(d -> {
            DishVO dv = new DishVO();
            dv.setId(d.getId());
            dv.setName(d.getName());
            dv.setPrice(d.getPrice() == null ? null : d.getPrice().doubleValue());
            dv.setEmoji(d.getEmoji());
            dv.setDesc(d.getDescription());
            dv.setSpecs(parseSpecs(d.getSpecs()));
            return dv;
        }).collect(Collectors.toList()));

        List<Review> reviews = reviewMapper.selectList(
                new QueryWrapper<Review>().eq("restaurant_id", id).orderByAsc("id"));
        vo.setReviews(reviews.stream().map(rv -> {
            ReviewVO rvo = new ReviewVO();
            rvo.setId(rv.getId());
            rvo.setUser(rv.getUserName());
            rvo.setRating(rv.getRating());
            rvo.setContent(rv.getContent());
            rvo.setDate(rv.getDateLabel());
            String u = rv.getUserName();
            rvo.setAvatar(u == null || u.isEmpty() ? "?" : u.substring(0, 1));
            return rvo;
        }).collect(Collectors.toList()));

        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        vo.setAvgRating(Math.round(avg * 10.0) / 10.0);
        vo.setReviewCount(reviews.size());
        return vo;
    }

    /**
     * 解析分类子树的所有节点 id（分级分类搜索的核心）。
     *
     * 走物化路径：拿到目标节点的 path（如二级「面食」是 /1/2/），
     * 用 path LIKE '/1/2/%' 一次查出它自己和全部后代，命中 idx_path 索引。
     *
     * @return null 表示「不限分类」；空集合表示分类不存在（调用方应返回空结果）
     */
    private List<Long> resolveSubtreeIds(Long categoryId, String categoryName) {
        Category root;
        if (categoryId != null) {
            root = categoryMapper.selectById(categoryId);
            if (root == null) {
                return Collections.emptyList();
            }
        } else {
            String name = (categoryName == null) ? "" : categoryName.trim();
            if (name.isEmpty() || "全部".equals(name)) {
                return null; // 不限分类
            }
            // 同名分类可能存在于不同分支，优先取层级最浅的那个
            List<Category> matched = categoryMapper.selectList(
                    new QueryWrapper<Category>().eq("name", name)
                            .eq("enabled", 1).orderByAsc("level").orderByAsc("id"));
            if (matched.isEmpty()) {
                return Collections.emptyList();
            }
            root = matched.get(0);
        }

        String path = root.getPath();
        if (path == null || path.isEmpty()) {
            return Collections.singletonList(root.getId());
        }
        // path 形如 /1/2/，LIKE '/1/2/%' 会同时命中自己与所有后代
        List<Category> subtree = categoryMapper.selectList(
                new QueryWrapper<Category>().likeRight("path", path).eq("enabled", 1));
        List<Long> ids = subtree.stream().map(Category::getId)
                .filter(Objects::nonNull).collect(Collectors.toList());
        if (ids.isEmpty()) {
            ids = Collections.singletonList(root.getId());
        }
        return ids;
    }

    /** 拥有指定分类（含子树）菜品的店铺 id 集合 —— 三级品类搜索靠它反查店铺 */
    private Set<Long> restaurantIdsByDishCategory(Collection<Long> catIds) {
        if (catIds == null || catIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<Dish> dishes = dishMapper.selectList(
                new QueryWrapper<Dish>().select("DISTINCT restaurant_id").in("category_id", catIds));
        return dishes.stream()
                .map(Dish::getRestaurantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /** 拼接 id 列表用于 EXISTS 子查询（id 来自数据库自增主键，无注入风险） */
    private String joinIds(Collection<Long> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private RestaurantVO toVO(Restaurant r, Map<Long, Integer> priceMap) {
        RestaurantVO vo = new RestaurantVO();
        copyBase(r, vo);
        vo.setPrice(resolvePrice(r, priceMap));
        vo.setDistanceM(parseDistance(r.getDistance()));
        return vo;
    }

    /** 每家店人均价：优先取店内菜品均价，无菜品时回退分类基准价 */
    private Map<Long, Integer> avgPriceByRestaurant() {
        List<Dish> dishes = dishMapper.selectList(null);
        Map<Long, BigDecimal> sum = new HashMap<>();
        Map<Long, Integer> count = new HashMap<>();
        for (Dish d : dishes) {
            if (d.getRestaurantId() == null || d.getPrice() == null) {
                continue;
            }
            sum.merge(d.getRestaurantId(), d.getPrice(), BigDecimal::add);
            count.merge(d.getRestaurantId(), 1, Integer::sum);
        }
        Map<Long, Integer> avg = new HashMap<>();
        for (Map.Entry<Long, BigDecimal> e : sum.entrySet()) {
            int c = count.getOrDefault(e.getKey(), 0);
            if (c > 0) {
                avg.put(e.getKey(),
                        e.getValue().divide(BigDecimal.valueOf(c), 0, RoundingMode.HALF_UP).intValue());
            }
        }
        return avg;
    }

    private int resolvePrice(Restaurant r, Map<Long, Integer> priceMap) {
        Integer p = priceMap.get(r.getId());
        if (p != null && p > 0) {
            return p;
        }
        String cat = r.getCat() == null ? "" : r.getCat();
        return PRICE_BASE.getOrDefault(cat, 25);
    }

    private int parseDistance(String str) {
        if (str == null) {
            return 999999;
        }
        Matcher m = DISTANCE_PATTERN.matcher(str.trim().toLowerCase());
        if (!m.find()) {
            return 999999;
        }
        double num;
        try {
            num = Double.parseDouble(m.group(1));
        } catch (Exception e) {
            return 999999;
        }
        String unit = m.group(2) == null ? "m" : m.group(2);
        boolean km = "km".equals(unit) || "公里".equals(unit);
        return (int) Math.round(km ? num * 1000 : num);
    }

    @Override
    public List<Map<String, Object>> suggest(String keyword, int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        String k = keyword == null ? "" : keyword.trim();
        if (k.isEmpty()) {
            return out;
        }
        if (limit <= 0) {
            limit = 8;
        }

        List<Restaurant> restaurants = baseMapper.selectList(null);
        Map<Long, Restaurant> byId = new HashMap<>();
        for (Restaurant r : restaurants) {
            byId.put(r.getId(), r);
        }

        Set<String> seen = new HashSet<>();

        // 店铺占位上限：保证「菜品」永远有机会出现，否则用户搜「面」
        // 只会看到一堆面馆，看不到「招牌牛肉面」这类菜品。
        int restaurantQuota = Math.max(1, (int) Math.ceil(limit * 0.6));

        // 1) 店铺名 / 分类命中（优先，但不超过配额）
        for (Restaurant r : restaurants) {
            if (out.size() >= limit || out.size() >= restaurantQuota) {
                break;
            }
            String name = r.getName() == null ? "" : r.getName();
            String cat = r.getCat() == null ? "" : r.getCat();
            if (name.contains(k) || cat.contains(k)) {
                out.add(suggestionItem("restaurant", r.getId(), name, cat, r.getEmoji()));
                seen.add("r-" + r.getId());
            }
        }

        // 2) 菜品名命中（点选后跳转到所属店铺），占满剩余名额
        List<Dish> dishes = dishMapper.selectList(null);
        for (Dish d : dishes) {
            if (out.size() >= limit) {
                break;
            }
            String dn = d.getName() == null ? "" : d.getName();
            if (!dn.contains(k) || seen.contains("d-" + dn)) {
                continue;
            }
            Restaurant r = byId.get(d.getRestaurantId());
            String sub = r == null || r.getName() == null ? "" : r.getName();
            out.add(suggestionItem("dish", d.getRestaurantId(), dn, sub, d.getEmoji()));
            seen.add("d-" + dn);
        }

        // 3) 菜品仍然没占到名额（比如关键字只命中极少数菜品）时，
        //    用剩余店铺补齐，避免因为配额导致结果比 limit 少。
        if (out.size() < limit) {
            for (Restaurant r : restaurants) {
                if (out.size() >= limit) {
                    break;
                }
                String name = r.getName() == null ? "" : r.getName();
                String cat = r.getCat() == null ? "" : r.getCat();
                if ((name.contains(k) || cat.contains(k)) && !seen.contains("r-" + r.getId())) {
                    out.add(suggestionItem("restaurant", r.getId(), name, cat, r.getEmoji()));
                    seen.add("r-" + r.getId());
                }
            }
        }
        return out;
    }

    private Map<String, Object> suggestionItem(String kind, Long id, String name, String sub, String emoji) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kind", kind);
        m.put("id", id);
        m.put("name", name);
        m.put("sub", sub);
        m.put("emoji", emoji);
        return m;
    }

    private void copyBase(Restaurant r, RestaurantVO vo) {
        vo.setId(r.getId());
        vo.setName(r.getName());
        vo.setEmoji(r.getEmoji());
        vo.setRating(r.getRating() == null ? null : r.getRating().doubleValue());
        vo.setDesc(r.getDescription());
        vo.setCat(r.getCat());
        vo.setDistance(r.getDistance());
        vo.setTags(splitTags(r.getTags()));
        vo.setMinOrder(r.getMinOrder() == null ? null : r.getMinOrder().doubleValue());
        vo.setDeliveryFee(r.getDeliveryFee() == null ? null : r.getDeliveryFee().doubleValue());
        vo.setEta(r.getEta());
        vo.setOpenStatus(r.getOpenStatus());
        vo.setCategoryId(r.getCategoryId());
    }

    private void copyBase(Restaurant r, RestaurantDetailVO vo) {
        vo.setId(r.getId());
        vo.setName(r.getName());
        vo.setEmoji(r.getEmoji());
        vo.setRating(r.getRating() == null ? null : r.getRating().doubleValue());
        vo.setDesc(r.getDescription());
        vo.setCat(r.getCat());
        vo.setDistance(r.getDistance());
        vo.setTags(splitTags(r.getTags()));
        vo.setMinOrder(r.getMinOrder() == null ? null : r.getMinOrder().doubleValue());
        vo.setDeliveryFee(r.getDeliveryFee() == null ? null : r.getDeliveryFee().doubleValue());
        vo.setEta(r.getEta());
        vo.setOpenStatus(r.getOpenStatus());
    }

    private List<String> splitTags(String tags) {
        if (tags == null || tags.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * 解析菜品规格 JSON：[{name,type,options:[{label,price}]}] -> List&lt;DishSpecVO&gt;。
     * 解析失败或为空时返回 null（前端据此隐藏规格区）。
     */
    private List<DishSpecVO> parseSpecs(String specsJson) {
        if (specsJson == null || specsJson.trim().isEmpty()) {
            return null;
        }
        try {
            List<Map<String, Object>> raw = OBJECT_MAPPER.readValue(
                    specsJson, new TypeReference<List<Map<String, Object>>>() {});
            if (raw == null || raw.isEmpty()) {
                return null;
            }
            List<DishSpecVO> result = new ArrayList<>();
            for (Map<String, Object> item : raw) {
                DishSpecVO vo = new DishSpecVO();
                vo.setName(asString(item.get("name")));
                vo.setType(asString(item.get("type")));
                Object optsRaw = item.get("options");
                List<DishSpecOptionVO> options = new ArrayList<>();
                if (optsRaw instanceof List) {
                    for (Object o : (List<?>) optsRaw) {
                        if (o instanceof Map) {
                            Map<?, ?> om = (Map<?, ?>) o;
                            DishSpecOptionVO opt = new DishSpecOptionVO();
                            opt.setLabel(asString(om.get("label")));
                            opt.setPrice(asDouble(om.get("price")));
                            options.add(opt);
                        }
                    }
                }
                vo.setOptions(options);
                result.add(vo);
            }
            return result.isEmpty() ? null : result;
        } catch (Exception e) {
            return null;
        }
    }

    private String asString(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private Double asDouble(Object o) {
        if (o == null) {
            return 0.0;
        }
        if (o instanceof Number) {
            return ((Number) o).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return 0.0;
        }
    }
}
