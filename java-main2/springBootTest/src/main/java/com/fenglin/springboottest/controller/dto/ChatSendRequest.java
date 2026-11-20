package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/** 发送聊天消息：POST /api/chat/conversations/{id}/messages 或 /api/admin/chat/conversations/{id}/messages */
@Data
public class ChatSendRequest {

    /** 用户账号（后台回复时可不传） */
    private String account;

    /** 消息内容（1~500 字） */
    private String content;
}
