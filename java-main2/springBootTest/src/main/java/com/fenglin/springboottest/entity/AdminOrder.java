package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 订单（后台「订单管理」用，对应首页「下单点餐」产生的订单）。
 */
@Data
@TableName("admin_order")
public class AdminOrder {

    @TableId(value = "id", type = IdType.INPUT)
    private String id;

    private String account;

    private String restaurant;

    private String items;

    private BigDecimal amount;

    private String status;

    private String createdAt;
}
