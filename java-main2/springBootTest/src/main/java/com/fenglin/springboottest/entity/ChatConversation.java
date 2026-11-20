package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单聊天会话，对应数据表 chat_conversation。
 * 一个订单只允许一个会话（order_id 唯一），用户与商家在该会话里沟通。
 */
@Data
@TableName("chat_conversation")
public class ChatConversation {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 订单 id（一单一会话） */
    private Long orderId;

    /** 订单号快照 */
    private String orderNo;

    /** 用户账号 */
    private String account;

    /** 店铺 id */
    private Long restaurantId;

    /** 店铺名称快照 */
    private String restaurantName;

    /** 用户昵称快照 */
    private String userName;

    /** 最后一条消息（列表页展示） */
    private String lastMessage;

    /** 最后一条消息时间 */
    private LocalDateTime lastMessageAt;

    /** 用户未读数 */
    private Integer userUnread;

    /** 商家未读数 */
    private Integer merchantUnread;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
