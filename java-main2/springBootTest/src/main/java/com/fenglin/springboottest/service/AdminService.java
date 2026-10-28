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

import java.util.*;

/**
 * 后台管理系统业务层：对接首页 6 大模块的真实数据（H2 库）。
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

    @Autowired
    public AdminService(AdminConfigMapper configMapper, AdminCategoryMapper categoryMapper,
                        AdminDishMapper dishMapper, AdminUserMapper userMapper,
                        AdminOrderMapper orderMapper, AdminAccountMapper accountMapper) {
        this.configMapper = configMapper;
        this.categoryMapper = categoryMapper;
        this.dishMapper = dishMapper;
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
        this.accountMapper = accountMapper;
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

    // ============ 启动播种（H2 内存库每次启动重置，确保可登录 / 有默认配置）============
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
