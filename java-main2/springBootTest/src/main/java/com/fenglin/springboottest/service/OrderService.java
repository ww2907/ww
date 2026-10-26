package com.fenglin.springboottest.service;

import com.fenglin.springboottest.controller.dto.OrderCreateRequest;
import com.fenglin.springboottest.vo.OrderStatsVO;
import com.fenglin.springboottest.vo.OrderVO;

import java.util.List;

/**
 * 订单业务：
 *   - 创建订单（下单）
 *   - 按账号查询我的订单（支持按状态过滤）
 *   - 个人中心统计：订单次数 + 常点食物
 */
public interface OrderService {

    /** 创建订单，返回订单详情 */
    OrderVO createOrder(OrderCreateRequest req);

    /** 按账号查询订单（最新在前）。status 为 null 时返回全部，否则按状态过滤；account 为空时返回空列表 */
    List<OrderVO> listByAccount(String account, Integer status);

    /** 个人中心统计：订单次数（按状态分组）+ 常点食物榜单 */
    OrderStatsVO getStats(String account);

    /** 订单详情：按 id 查询单个订单（含明细）；不存在抛 404 */
    OrderVO getById(Long id);

    /**
     * 变更订单状态（前端订单操作）：0=待支付 1=已支付 2=已完成 3=已取消。
     * 仅允许合法流转：待支付→已支付/已取消；已支付→已完成/已取消。
     * 已完成 / 已取消 为终态，不可再变更。返回更新后的订单详情。
     */
    OrderVO updateStatus(Long id, Integer status);
}
