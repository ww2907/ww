package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.entity.*;
import com.fenglin.springboottest.mapper.*;
import com.fenglin.springboottest.vo.UserAddressVO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final AdminOrderMapper orderMapper;
    private final AdminAccountMapper accountMapper;
    private final OrderMapper bizOrderMapper;
    private final UserMapper regUserMapper;
    private final UserAddressMapper addressMapper;
    private final UserProfileService profileService;

    @Autowired
    public AdminService(AdminConfigMapper configMapper, AdminCategoryMapper categoryMapper,
                        AdminDishMapper dishMapper,
                        AdminOrderMapper orderMapper, AdminAccountMapper accountMapper,
                        OrderMapper bizOrderMapper, UserMapper regUserMapper,
                        UserAddressMapper addressMapper, UserProfileService profileService) {
        this.configMapper = configMapper;
        this.categoryMapper = categoryMapper;
        this.dishMapper = dishMapper;
        this.orderMapper = orderMapper;
        this.accountMapper = accountMapper;
        this.bizOrderMapper = bizOrderMapper;
        this.regUserMapper = regUserMapper;
        this.addressMapper = addressMapper;
        this.profileService = profileService;
    }

    private static final String DEFAULT_PLACEHOLDER = "搜美食、搜好店，回车进入美食页…";
    private static final List<String> DEFAULT_HOTWORDS = Arrays.asList("牛肉面", "火锅", "轻食", "奶茶", "沙拉", "炸鸡");
    /** 后台表格统一使用的注册时间格式 */
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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

    // ============ 6. 用户（真实注册用户表 user）============
    /**
     * 用户列表：读真实 user 表（不再读 admin_user 种子表），并附带每位用户的收货地址数量，
     * 让后台「用户管理」与前台「我的」页面（头像 / 昵称 / 性别 / 手机 / 签名 / 地址）保持一致。
     */
    public List<AdminUser> listUsers() {
        List<User> users = regUserMapper.selectList(new QueryWrapper<User>().orderByAsc("id"));
        Map<String, Integer> addrCountMap = countAddressByAccount();
        List<AdminUser> result = new ArrayList<>();
        for (User u : users) {
            AdminUser vo = toAdminUser(u);
            vo.setAddressCount(addrCountMap.getOrDefault(u.getAccount(), 0));
            result.add(vo);
        }
        return result;
    }

    /**
     * 后台编辑用户资料：只接收前台「我的」页面可编辑的字段（昵称 / 头像 / 性别 / 手机 / 签名）
     * 以及账号状态；账号、密码、注册时间不可经由该接口修改。
     */
    public void updateUser(AdminUser u) {
        if (u == null || u.getId() == null) {
            throw new BusinessException("缺少用户信息");
        }
        User target = regUserMapper.selectById(u.getId());
        if (target == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (u.getNickname() != null) {
            String nickname = u.getNickname().trim();
            if (nickname.isEmpty()) nickname = target.getAccount();
            if (nickname.length() > 20) {
                throw new BusinessException("昵称不能超过 20 个字符");
            }
            target.setNickname(nickname);
        }
        if (u.getAvatar() != null) {
            String avatar = u.getAvatar().trim();
            if (avatar.length() > 16) {
                throw new BusinessException("头像不能超过 16 个字符");
            }
            target.setAvatar(avatar);
        }
        if (u.getGender() != null) {
            String gender = u.getGender().trim();
            if (!gender.isEmpty() && !"男".equals(gender) && !"女".equals(gender)) {
                throw new BusinessException("性别只能为 男 / 女 / 空");
            }
            target.setGender(gender);
        }
        if (u.getPhone() != null) {
            String phone = u.getPhone().trim();
            if (phone.length() > 20) {
                throw new BusinessException("手机号过长");
            }
            target.setPhone(phone);
        }
        if (u.getBio() != null) {
            String bio = u.getBio().trim();
            if (bio.length() > 128) {
                throw new BusinessException("个性签名不能超过 128 个字符");
            }
            target.setBio(bio);
        }
        if (u.getStatus() != null) {
            if (u.getStatus() != 0 && u.getStatus() != 1) {
                throw new BusinessException("状态只能为 1（正常）或 0（禁用）");
            }
            target.setStatus(u.getStatus());
        }

        target.setUpdatedAt(LocalDateTime.now());
        regUserMapper.updateById(target);
    }

    /** 删除用户：连带清理其收货地址，避免 user_address 留下孤儿数据 */
    @Transactional(rollbackFor = Exception.class)
    public void removeUser(Long id) {
        if (id == null) {
            throw new BusinessException("缺少用户信息");
        }
        User target = regUserMapper.selectById(id);
        if (target == null) {
            return;
        }
        regUserMapper.deleteById(id);
        addressMapper.delete(new QueryWrapper<UserAddress>().eq("account", target.getAccount()));
    }

    /** 后台查看某位用户的收货地址（复用前台「收货地址管理」的服务） */
    public List<UserAddressVO> listUserAddresses(Long id) {
        User target = regUserMapper.selectById(id);
        if (target == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return profileService.listAddresses(target.getAccount());
    }

    /** 后台删除某位用户的收货地址（脏数据清理） */
    public void removeUserAddress(Long id, Long addressId) {
        User target = regUserMapper.selectById(id);
        if (target == null) {
            throw new BusinessException(404, "用户不存在");
        }
        UserAddress a = addressMapper.selectById(addressId);
        if (a == null) {
            return;
        }
        if (!target.getAccount().equals(a.getAccount())) {
            throw new BusinessException("该地址不属于此用户");
        }
        addressMapper.deleteById(addressId);
    }

    /** 按账号统计收货地址数量，一次 group by 取回，避免 N+1 查询 */
    private Map<String, Integer> countAddressByAccount() {
        Map<String, Integer> map = new HashMap<>();
        List<Map<String, Object>> rows = addressMapper.selectMaps(new QueryWrapper<UserAddress>()
                .select("account", "COUNT(*) AS cnt")
                .groupBy("account"));
        for (Map<String, Object> row : rows) {
            Object acc = row.get("account");
            Object cnt = row.get("cnt");
            if (acc == null || cnt == null) continue;
            map.put(String.valueOf(acc), ((Number) cnt).intValue());
        }
        return map;
    }

    private AdminUser toAdminUser(User u) {
        AdminUser vo = new AdminUser();
        vo.setId(u.getId());
        vo.setAccount(u.getAccount());
        vo.setNickname(u.getNickname());
        vo.setAvatar(u.getAvatar() == null ? "" : u.getAvatar());
        vo.setGender(u.getGender() == null ? "" : u.getGender());
        vo.setPhone(u.getPhone() == null ? "" : u.getPhone());
        vo.setBio(u.getBio() == null ? "" : u.getBio());
        vo.setAccountType(u.getAccountType());
        vo.setStatus(u.getStatus());
        vo.setCreatedAt(u.getCreatedAt() == null ? "" : u.getCreatedAt().format(TIME_FMT));
        vo.setAddressCount(0);
        return vo;
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
