package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单主表实体，对应数据表 orders。
 * 下单用户（user_id）允许为空：未登录 / 游客也能下单，账号以 account 冗余存储便于展示。
 */
@Data
@TableName("orders")
public class Order {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单编号（业务可读，唯一） */
    private String orderNo;

    /** 下单用户 id（游客可为空） */
    private Long userId;

    /** 下单账号（展示用，冗余） */
    private String account;

    /** 店铺 id */
    private Long restaurantId;

    /** 店铺名称（快照，便于展示） */
    private String restaurantName;

    /** 订单总额 */
    private BigDecimal totalAmount;

    /** 商品总件数 */
    private Integer itemCount;

    /** 订单状态：0=待支付 1=已支付 2=已完成 3=已取消 */
    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
