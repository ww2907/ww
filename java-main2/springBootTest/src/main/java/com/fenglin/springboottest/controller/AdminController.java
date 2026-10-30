package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.AdminLoginRequest;
import com.fenglin.springboottest.controller.dto.PriceUpdateRequest;
import com.fenglin.springboottest.controller.dto.PriceBatchRequest;
import com.fenglin.springboottest.entity.*;
import com.fenglin.springboottest.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 后台管理系统接口，统一挂在 /api/admin 下，与前端 src/api/admin.js 的约定一致。
 * 返回结构统一为 { code: 0, message: 'ok', data: {...} }，code === 0 视为成功。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** 登录（仅登录，无注册）：POST /api/admin/login */
    @PostMapping("/login")
    public Result<?> login(@RequestBody AdminLoginRequest req) {
        return Result.success(adminService.adminLogin(req.getAccount(), req.getPassword()));
    }

    // ---------- 1. 导航配置（顶部 + 底部）----------
    @GetMapping("/nav")
    public Result<?> getNav() {
        return Result.success(adminService.getNavConfig());
    }

    @PutMapping("/nav")
    public Result<?> updateNav(@RequestBody Map<String, Object> body) {
        adminService.updateNavConfig(body);
        return Result.success();
    }

    // ---------- 2. 搜索配置 ----------
    @GetMapping("/search")
    public Result<?> getSearch() {
        return Result.success(adminService.getSearchConfig());
    }

    @PutMapping("/search")
    public Result<?> updateSearch(@RequestBody Map<String, Object> body) {
        adminService.updateSearchConfig(body);
        return Result.success();
    }

    // ---------- 3. 推荐配置 ----------
    @GetMapping("/recommend")
    public Result<?> getRecommend() {
        return Result.success(adminService.getRecommend());
    }

    @PutMapping("/recommend")
    public Result<?> updateRecommend(@RequestBody Map<String, Object> body) {
        Object ids = body.get("ids");
        adminService.updateRecommend(ids instanceof List ? (List<?>) ids : List.of());
        return Result.success();
    }

    // ---------- 4. 分类 ----------
    @GetMapping("/category")
    public Result<?> listCategory() {
        return Result.success(adminService.listCategories());
    }

    @PostMapping("/category")
    public Result<?> addCategory(@RequestBody AdminCategory cat) {
        adminService.saveCategory(cat);
        return Result.success();
    }

    @PutMapping("/category")
    public Result<?> updCategory(@RequestBody AdminCategory cat) {
        adminService.saveCategory(cat);
        return Result.success();
    }

    @DeleteMapping("/category/{id}")
    public Result<?> delCategory(@PathVariable Long id) {
        adminService.removeCategory(id);
        return Result.success();
    }

    // ---------- 5. 菜品 ----------
    @GetMapping("/dish")
    public Result<?> listDish() {
        return Result.success(adminService.listDishes());
    }

    @PostMapping("/dish")
    public Result<?> addDish(@RequestBody AdminDish dish) {
        adminService.saveDish(dish);
        return Result.success();
    }

    @PutMapping("/dish")
    public Result<?> updDish(@RequestBody AdminDish dish) {
        adminService.saveDish(dish);
        return Result.success();
    }

    @DeleteMapping("/dish/{id}")
    public Result<?> delDish(@PathVariable Long id) {
        adminService.removeDish(id);
        return Result.success();
    }

    // ---------- 8. 价格（数字管理）----------
    /** 单条改价：PUT /api/admin/dish/{id}/price  body: { price: 12.50 } */
    @PutMapping("/dish/{id}/price")
    public Result<?> updateDishPrice(@PathVariable Long id, @RequestBody PriceUpdateRequest req) {
        adminService.updateDishPrice(id, req.getPrice());
        return Result.success();
    }

    /** 批量改价：POST /api/admin/dish/price/batch  body: { mode, value, ids } */
    @PostMapping("/dish/price/batch")
    public Result<?> batchUpdatePrice(@RequestBody PriceBatchRequest req) {
        int n = adminService.batchUpdatePrice(req.getMode(), req.getValue(), req.getIds());
        return Result.success(n);
    }

    // ---------- 6. 用户 ----------
    @GetMapping("/user")
    public Result<?> listUser() {
        return Result.success(adminService.listUsers());
    }

    @PutMapping("/user")
    public Result<?> updUser(@RequestBody AdminUser u) {
        adminService.updateUser(u);
        return Result.success();
    }

    @DeleteMapping("/user/{id}")
    public Result<?> delUser(@PathVariable Long id) {
        adminService.removeUser(id);
        return Result.success();
    }

    // ---------- 7. 订单 ----------
    @GetMapping("/order")
    public Result<?> listOrder() {
        return Result.success(adminService.listOrders());
    }

    @PutMapping("/order/{id}/status")
    public Result<?> updOrderStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        adminService.updateOrderStatus(id, (String) body.get("status"));
        return Result.success();
    }

    @DeleteMapping("/order/{id}")
    public Result<?> delOrder(@PathVariable String id) {
        adminService.removeOrder(id);
        return Result.success();
    }
}
