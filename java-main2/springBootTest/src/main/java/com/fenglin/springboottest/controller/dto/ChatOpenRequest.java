package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/** 打开订单会话：POST /api/chat/conversations */
@Data
public class ChatOpenRequest {

    /** 订单 id（一单一会话） */
    private Long orderId;

    /** 当前登录账号（必须与订单 account 一致） */
    private String account;
}
