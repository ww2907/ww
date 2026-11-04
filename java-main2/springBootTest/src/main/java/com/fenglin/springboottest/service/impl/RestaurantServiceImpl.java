package com.fenglin.springboottest.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
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
        QueryWrapper<Restaurant> qw = new QueryWrapper<>();

        // 关键字：匹配店名 / 简介 / 标签
        if (keyword != null && !keyword.trim().isEmpty()) {
            String k = keyword.trim();
            qw.and(w -> w.like("name", k).or().like("description", k).or().like("tags", k));
        }

        // 分级分类搜索：传入父分类时，自动包含其下所有子分类
        if (category != null && !category.trim().isEmpty() && !"全部".equals(category.trim())) {
            List<String> names = resolveCategoryNames(category.trim());
            if (names.isEmpty()) {
                qw.eq("cat", category.trim());
            } else {
                qw.in("cat", names);
            }
        }

        qw.orderByDesc("sort");
        Map<Long, Integer> priceMap = avgPriceByRestaurant();
        return baseMapper.selectList(qw).stream().map(r -> toVO(r, priceMap)).collect(Collectors.toList());
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
        List<Restaurant> all = baseMapper.selectList(null);

        // 与 recommended 共用口径：评分最高的 12 家作为「推荐集」，从美食页中剔除
        Set<Long> recommendedIds = topRated(12).stream()
                .map(Restaurant::getId)
                .collect(Collectors.toSet());

        // 关键字：匹配店名 / 简介 / 标签
        String k = (keyword == null) ? null : keyword.trim();
        // 分级分类：传入父分类时包含其下所有子分类
        List<String> names = (category != null && !category.trim().isEmpty() && !"全部".equals(category.trim()))
                ? resolveCategoryNames(category.trim()) : null;

        Map<Long, Integer> priceMap = avgPriceByRestaurant();
        return all.stream()
                .filter(r -> !recommendedIds.contains(r.getId()))
                .filter(r -> matchKeyword(r, k))
                .filter(r -> matchCategory(r, category, names))
                .sorted((a, b) -> compareSortDesc(a, b))
                .map(r -> toVO(r, priceMap))
                .collect(Collectors.toList());
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

    private boolean matchCategory(Restaurant r, String category, List<String> names) {
        if (names == null) {
            return true; // "全部" 或未传分类
        }
        if (names.isEmpty()) {
            // 未匹配到分级分类，按精确分类名匹配
            return category != null && category.trim().equals(r.getCat());
        }
        return names.contains(r.getCat());
    }

    @Override
    public List<String> categories() {
        List<Category> all = categoryMapper.selectList(
                new QueryWrapper<Category>().orderByAsc("sort_order"));
        List<String> result = new ArrayList<>();
        result.add("全部");
        for (Category c : all) {
            result.add(c.getName());
        }
        return result;
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

    /** 解析分类及其所有后代分类的名称集合（用于分级分类搜索） */
    private List<String> resolveCategoryNames(String categoryName) {
        List<Category> all = categoryMapper.selectList(null);
        Category target = all.stream()
                .filter(c -> c.getName().equals(categoryName))
                .findFirst().orElse(null);
        if (target == null) {
            return Collections.emptyList();
        }
        Set<String> names = new HashSet<>();
        names.add(target.getName());
        collectDescendants(target.getId(), all, names);
        return new ArrayList<>(names);
    }

    private void collectDescendants(Long parentId, List<Category> all, Set<String> names) {
        for (Category c : all) {
            if (parentId.equals(c.getParentId())) {
                names.add(c.getName());
                collectDescendants(c.getId(), all, names);
            }
        }
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

        // 1) 店铺名 / 分类命中（优先）
        for (Restaurant r : restaurants) {
            if (out.size() >= limit) {
                return out;
            }
            String name = r.getName() == null ? "" : r.getName();
            String cat = r.getCat() == null ? "" : r.getCat();
            if (name.contains(k) || cat.contains(k)) {
                out.add(suggestionItem("restaurant", r.getId(), name, cat, r.getEmoji()));
                seen.add("r-" + r.getId());
            }
        }

        // 2) 菜品名命中（点选后跳转到所属店铺）
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
}
