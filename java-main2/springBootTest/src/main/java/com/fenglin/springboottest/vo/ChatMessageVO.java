package com.fenglin.springboottest.vo;

import lombok.Data;

/** 聊天消息（用户端 / 后台客服台共用） */
@Data
public class ChatMessageVO {

    private Long id;

    private Long conversationId;

    /** 发送方：user / merchant */
    private String senderType;

    private String senderName;

    private String content;

    /** 发送时间（yyyy-MM-dd HH:mm） */
    private String createdAt;
}
