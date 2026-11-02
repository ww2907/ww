package com.fenglin.springboottest.service;

import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.entity.*;
import com.fenglin.springboottest.mapper.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * 后台管理系统业务层：对接首页 6 大模块的真实数据（MySQL 库 shiguang_food）。
 *  - 导航 / 搜索 / 推荐三类配置以 JSON 存于 admin_config 表；
 *  - 分类 / 菜品 / 用户 / 订单为独立关系表；
 *  - 管理员账号存于 admin_account（BCrypt 加密），启动时空表则播种 admin/admin123；
 *  - 配置项为空时回退到与前端一致的默认值。
 */
@Service
public class AdminService implements CommandLineRunner {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private final AdminConfigMapper configMapper;
    private final AdminCategoryMapper categoryMapper;
    private final AdminDishMapper dishMapper;
    private final AdminUserMapper userMapper;
    private final AdminOrderMapper orderMapper;
    private final AdminAccountMapper accountMapper;
    private final OrderMapper bizOrderMapper;
    private final UserMapper regUserMapper;

    @Autowired
    public AdminService(AdminConfigMapper configMapper, AdminCategoryMapper categoryMapper,
                        AdminDishMapper dishMapper, AdminUserMapper userMapper,
                        AdminOrderMapper orderMapper, AdminAccountMapper accountMapper,
                        OrderMapper bizOrderMapper, UserMapper regUserMapper) {
        this.configMapper = configMapper;
        this.categoryMapper = categoryMapper;
        this.dishMapper = dishMapper;
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
        this.accountMapper = accountMapper;
        this.bizOrderMapper = bizOrderMapper;
        this.regUserMapper = regUserMapper;
    }

    private static final String DEFAULT_PLACEHOLDER = "搜美食、搜好店，回车进入美食页…";
    private static final List<String> DEFAULT_HOTWORDS = Arrays.asList("牛肉面", "火锅", "轻食", "奶茶", "沙拉", "炸鸡");

    // ============ 登录（仅登录，无注册）============
    public Map<String, Object> adminLogin(String account, String password) {
        AdminAccount a = accountMapper.selectById(account);
        if (a == null || !encoder.matches(password, a.getPassword())) {
            throw new BusinessException("管理员账号或密码错误");
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("account", account);
        r.put("token", UUID.randomUUID().toString());
        return r;
    }

    // ============ 配置读写（nav/search/recommend 以 JSON 存 admin_config）============
    private Map<String, Object> readJson(String key) {
        AdminConfig c = configMapper.selectById(key);
        if (c == null || c.getConfigValue() == null) return null;
        try {
            return objectMapper.readValue(c.getConfigValue(), new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private void writeJson(String key, Object obj) {
        try {
            String json = objectMapper.writeValueAsString(obj);
            AdminConfig existing = configMapper.selectById(key);
            AdminConfig c = new AdminConfig();
            c.setConfigKey(key);
            c.setConfigValue(json);
            if (existing == null) configMapper.insert(c);
            else configMapper.updateById(c);
        } catch (Exception e) {
            throw new BusinessException("配置序列化失败：" + e.getMessage());
        }
    }

    // ============ 1. 导航配置（顶部 + 底部）============
    public Map<String, Object> getNavConfig() {
        Map<String, Object> m = readJson("nav");
        return m != null ? m : defaultNav();
    }

    public void updateNavConfig(Map<String, Object> body) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("top", body.getOrDefault("top", new ArrayList<>()));
        m.put("bottom", body.getOrDefault("bottom", new ArrayList<>()));
        writeJson("nav", m);
    }

    // ============ 2. 搜索配置 ============
    public Map<String, Object> getSearchConfig() {
        Map<String, Object> m = readJson("search");
        if (m == null) {
            m = new LinkedHashMap<>();
            m.put("placeholder", DEFAULT_PLACEHOLDER);
            m.put("hotwords", DEFAULT_HOTWORDS);
        }
        return m;
    }

    public void updateSearchConfig(Map<String, Object> body) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("placeholder", body.get("placeholder"));
        m.put("hotwords", body.get("hotwords"));
        writeJson("search", m);
    }

    // ============ 3. 推荐配置 ============
    public Map<String, Object> getRecommend() {
        Map<String, Object> m = readJson("recommend");
        if (m == null) {
            m = new LinkedHashMap<>();
            m.put("ids", new ArrayList<>());
        }
        return m;
    }

    public void updateRecommend(List<?> ids) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ids", ids);
        writeJson("recommend", m);
    }

    // ============ 4. 分类 ============
    public List<AdminCategory> listCategories() {
        return categoryMapper.selectList(null);
    }

    public void saveCategory(AdminCategory cat) {
        if (cat.getId() == null) categoryMapper.insert(cat);
        else categoryMapper.updateById(cat);
    }

    public void removeCategory(Long id) {
        categoryMapper.deleteById(id);
    }

    // ============ 5. 菜品 ============
    public List<AdminDish> listDishes() {
        return dishMapper.selectList(null);
    }

    public void saveDish(AdminDish dish) {
        if (dish.getId() == null) dishMapper.insert(dish);
        else dishMapper.updateById(dish);
    }

    public void removeDish(Long id) {
        dishMapper.deleteById(id);
    }

    // ============ 8. 价格（数字管理）============
    /** 单条改价：价格四舍五入 2 位、不允许为负 */
    public void updateDishPrice(Long id, BigDecimal price) {
        AdminDish d = dishMapper.selectById(id);
        if (d == null) throw new BusinessException("菜品不存在（id=" + id + "）");
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("价格不能为负数");
        }
        d.setPrice(price.setScale(2, RoundingMode.HALF_UP));
        dishMapper.updateById(d);
    }

    /**
     * 批量改价：
     *  - mode = "rate"：现价 × value（系数须 > 0）
     *  - mode = "add" ：现价 + value（可负）
     *  - mode = "set" ：统一设为 value
     * 返回实际改动的菜品数。
     */
    public int batchUpdatePrice(String mode, BigDecimal value, List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BusinessException("请至少选择一个菜品");
        if (value == null) throw new BusinessException("请输入调整数值");
        if (!List.of("rate", "add", "set").contains(mode)) {
            throw new BusinessException("未知的批量调整方式：" + mode);
        }
        if ("rate".equals(mode) && value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("百分比系数必须大于 0");
        }
        List<AdminDish> dishes = dishMapper.selectBatchIds(ids);
        int n = 0;
        for (AdminDish d : dishes) {
            BigDecimal base = d.getPrice() == null ? BigDecimal.ZERO : d.getPrice();
            BigDecimal np;
            if ("rate".equals(mode)) np = base.multiply(value);
            else if ("add".equals(mode)) np = base.add(value);
            else np = value;
            np = np.setScale(2, RoundingMode.HALF_UP);
            if (np.compareTo(BigDecimal.ZERO) < 0) np = BigDecimal.ZERO;
            d.setPrice(np);
            dishMapper.updateById(d);
            n++;
        }
        return n;
    }

    // ============ 9. 数字管理 · 经营数据看板 ============
    /**
     * 聚合后台「数字管理」所需的全部经营指标，全部来自 MySQL 库 shiguang_food：
     *  - overview：累计订单、营业额(GMV)、注册用户、菜品总数、在售菜品、分类数、今日订单、今日营业额
     *  - categoryDist：各分类下的菜品数与价格合计
     *  - priceDist：价格区间分布（固定 0-15/15-25/25-35/35-50/50+ 五档，缺失补 0）
     *  - orderTrend：近 14 天（含今日）订单数与营业额，缺数据的日期补 0
     *  - topDishes：热销菜品 Top5（按累计点购数量）
     */
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("orderTotal", bizOrderMapper.countOrders());
        overview.put("gmv", bizOrderMapper.sumGmv());
        overview.put("userTotal", regUserMapper.countUsers());
        overview.put("dishTotal", dishMapper.selectCount(null));
        overview.put("dishOnSale", dishMapper.countOnSale());
        overview.put("categoryTotal", categoryMapper.selectCount(null));
        overview.put("todayOrder", bizOrderMapper.countTodayOrders());
        overview.put("todayGmv", bizOrderMapper.sumTodayGmv());

        // 分类分布
        List<Map<String, Object>> categoryDist = dishMapper.dishByCategory();

        // 价格区间分布：固定顺序，DB 缺档补 0
        List<Map<String, Object>> priceRaw = dishMapper.priceDistribution();
        Map<String, Integer> prMap = new LinkedHashMap<>();
        for (Map<String, Object> m : priceRaw) {
            prMap.put(String.valueOf(m.get("priceRange")), ((Number) m.get("dishCount")).intValue());
        }
        String[] ranges = {"0-15", "15-25", "25-35", "35-50", "50+"};
        List<Map<String, Object>> priceDist = new ArrayList<>();
        for (String r : ranges) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("priceRange", r);
            m.put("dishCount", prMap.getOrDefault(r, 0));
            priceDist.add(m);
        }

        // 近 14 天订单趋势：以今日为终点补齐每一天
        List<Map<String, Object>> trendRaw = bizOrderMapper.orderTrendRaw();
        Map<LocalDate, Map<String, Object>> trendMap = new LinkedHashMap<>();
        for (Map<String, Object> m : trendRaw) {
            Object d = m.get("orderDate");
            LocalDate ld = (d instanceof java.sql.Date) ? ((java.sql.Date) d).toLocalDate()
                    : LocalDate.parse(String.valueOf(d));
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("count", ((Number) m.get("orderCount")).longValue());
            e.put("gmv", (BigDecimal) m.get("gmv"));
            trendMap.put(ld, e);
        }
        List<Map<String, Object>> orderTrend = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            Map<String, Object> src = trendMap.get(d);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", d.toString());
            m.put("count", src == null ? 0L : ((Number) src.get("count")).longValue());
            m.put("gmv", src == null ? BigDecimal.ZERO : (BigDecimal) src.get("gmv"));
            orderTrend.add(m);
        }

        // 热销菜品 Top5
        List<Map<String, Object>> topDishes = bizOrderMapper.topDishesRaw();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("overview", overview);
        result.put("categoryDist", categoryDist);
        result.put("priceDist", priceDist);
        result.put("orderTrend", orderTrend);
        result.put("topDishes", topDishes);
        return result;
    }

    // ============ 6. 用户 ============
    public List<AdminUser> listUsers() {
        return userMapper.selectList(null);
    }

    public void updateUser(AdminUser u) {
        userMapper.updateById(u);
    }

    public void removeUser(Long id) {
        userMapper.deleteById(id);
    }

    // ============ 7. 订单 ============
    public List<AdminOrder> listOrders() {
        return orderMapper.selectList(null);
    }

    public void updateOrderStatus(String id, String status) {
        AdminOrder o = orderMapper.selectById(id);
        if (o == null) throw new BusinessException("订单不存在");
        o.setStatus(status);
        orderMapper.updateById(o);
    }

    public void removeOrder(String id) {
        orderMapper.deleteById(id);
    }

    // ============ 启动播种（MySQL 库，仅在缺失时补齐，确保可登录 / 有默认配置）============
    @Override
    public void run(String... args) {
        if (accountMapper.selectById("admin") == null) {
            AdminAccount a = new AdminAccount();
            a.setAccount("admin");
            a.setPassword(encoder.encode("admin123"));
            accountMapper.insert(a);
        }
        if (configMapper.selectById("nav") == null) writeJson("nav", defaultNav());
        if (configMapper.selectById("search") == null) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("placeholder", DEFAULT_PLACEHOLDER);
            m.put("hotwords", DEFAULT_HOTWORDS);
            writeJson("search", m);
        }
        if (configMapper.selectById("recommend") == null) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ids", new ArrayList<>());
            writeJson("recommend", m);
        }
    }

    private Map<String, Object> defaultNav() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("top", defaultNavItems());
        m.put("bottom", defaultNavItems());
        return m;
    }

    private List<Map<String, Object>> defaultNavItems() {
        String[][] defs = {
                {"home", "首页", "🏠", "1"},
                {"food", "美食", "🍽️", "2"},
                {"order", "订单", "🧾", "3"},
                {"mine", "我的", "👤", "4"}
        };
        List<Map<String, Object>> list = new ArrayList<>();
        for (String[] d : defs) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", d[0]);
            item.put("label", d[1]);
            item.put("icon", d[2]);
            item.put("sort", Integer.parseInt(d[3]));
            item.put("enabled", true);
            list.add(item);
        }
        return list;
    }
}
