package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单明细实体，对应数据表 order_item。
 * 菜品名称 / 单价均做快照存储，避免店铺后续改价影响历史订单。
 */
@Data
@TableName("order_item")
public class OrderItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 所属订单 id */
    private Long orderId;

    /** 菜品 id（快照，允许为空） */
    private Long dishId;

    /** 菜品名称（快照） */
    private String dishName;

    /** 单价（快照） */
    private BigDecimal price;

    /** 数量 */
    private Integer qty;

    /** 小计 = price * qty */
    private BigDecimal subtotal;

    private LocalDateTime createdAt;
}
