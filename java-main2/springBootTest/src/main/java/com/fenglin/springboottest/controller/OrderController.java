package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.OrderCreateRequest;
import com.fenglin.springboottest.service.OrderService;
import com.fenglin.springboottest.vo.OrderStatsVO;
import com.fenglin.springboottest.vo.OrderVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 订单接口，统一挂在 /api/orders 下，与前端 src/api/order.js 的约定一致：
 *   POST /api/orders                创建订单（下单）
 *   GET  /api/orders?account=&status= 按账号查询我的订单（status 可选：0待支付/1已支付/2已完成/3已取消）
 *   GET  /api/orders/stats?account=   个人中心统计：订单次数 + 常点食物
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

    /** 我的订单：GET /api/orders?account=&status= */
    @GetMapping
    public Result<List<OrderVO>> list(@RequestParam String account,
                                      @RequestParam(required = false) Integer status) {
        return Result.success(orderService.listByAccount(account, status));
    }

    /** 个人中心统计：GET /api/orders/stats?account= */
    @GetMapping("/stats")
    public Result<OrderStatsVO> stats(@RequestParam String account) {
        return Result.success(orderService.getStats(account));
    }

    /** 订单详情：GET /api/orders/{id} */
    @GetMapping("/{id}")
    public Result<OrderVO> detail(@PathVariable Long id) {
        return Result.success(orderService.getById(id));
    }

    /** 订单操作（去支付 / 确认完成 / 取消）：POST /api/orders/{id}/status?status= */
    @PostMapping("/{id}/status")
    public Result<OrderVO> updateStatus(@PathVariable Long id, @RequestParam int status) {
        return Result.success(orderService.updateStatus(id, status));
    }
}
