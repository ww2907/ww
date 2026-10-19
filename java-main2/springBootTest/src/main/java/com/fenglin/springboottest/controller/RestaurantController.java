package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.service.RestaurantService;
import com.fenglin.springboottest.vo.RestaurantDetailVO;
import com.fenglin.springboottest.vo.RestaurantVO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 店铺接口，统一挂在 /api/restaurants 下，与前端 src/api/food.js、restaurant.js 的
 * ENDPOINTS 约定一致：
 *   GET /api/restaurants/search      首页列表 + 搜索（可分级分类）
 *   GET /api/restaurants/categories  分类列表
 *   GET /api/restaurants/{id}        店铺详情（菜单 + 评价）
 */
@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    /** 首页店铺列表 / 搜索：GET /api/restaurants/search?keyword=&category= */
    @GetMapping("/search")
    public Result<List<RestaurantVO>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category) {
        return Result.success(restaurantService.search(keyword, category));
    }

    /** 分类列表：GET /api/restaurants/categories */
    @GetMapping("/categories")
    public Result<List<String>> categories() {
        return Result.success(restaurantService.categories());
    }

    /** 店铺详情：GET /api/restaurants/{id} */
    @GetMapping("/{id}")
    public Result<RestaurantDetailVO> detail(@PathVariable Long id) {
        return Result.success(restaurantService.detail(id));
    }
}
