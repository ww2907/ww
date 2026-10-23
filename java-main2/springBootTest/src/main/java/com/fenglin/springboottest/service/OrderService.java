package com.fenglin.springboottest.service;

import com.fenglin.springboottest.controller.dto.OrderCreateRequest;
import com.fenglin.springboottest.vo.OrderVO;

import java.util.List;

/**
 * 订单业务：
 *   - 创建订单（下单）
 *   - 按账号查询我的订单
 */
public interface OrderService {

    /** 创建订单，返回订单详情 */
    OrderVO createOrder(OrderCreateRequest req);

    /** 按账号查询订单（最新在前），account 为空时返回空列表 */
    List<OrderVO> listByAccount(String account);
}
