package com.fenglin.springboottest.vo;

import lombok.Data;

/** 聊天会话（用户端 / 后台客服台共用） */
@Data
public class ChatConversationVO {

    private Long id;

    private Long orderId;

    private String orderNo;

    private String account;

    private Long restaurantId;

    private String restaurantName;

    /** 用户昵称（后台展示用） */
    private String userName;

    /** 最后一条消息 */
    private String lastMessage;

    /** 最后消息时间（yyyy-MM-dd HH:mm） */
    private String lastMessageAt;

    /** 用户未读数（后台回复后 +1） */
    private Integer userUnread;

    /** 商家未读数（用户发消息后 +1） */
    private Integer merchantUnread;

    /** 会话创建时间（yyyy-MM-dd HH:mm） */
    private String createdAt;
}
