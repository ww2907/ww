package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.OrderCreateRequest;
import com.fenglin.springboottest.service.OrderService;
import com.fenglin.springboottest.vo.OrderVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 订单接口，统一挂在 /api/orders 下，与前端 src/api/order.js 的约定一致：
 *   POST /api/orders           创建订单（下单）
 *   GET  /api/orders?account=  按账号查询我的订单
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** 下单：POST /api/orders */
    @PostMapping
    public Result<OrderVO> create(@RequestBody OrderCreateRequest req) {
        return Result.success(orderService.createOrder(req));
    }

    /** 我的订单：GET /api/orders?account= */
    @GetMapping
    public Result<List<OrderVO>> list(@RequestParam String account) {
        return Result.success(orderService.listByAccount(account));
    }
}
