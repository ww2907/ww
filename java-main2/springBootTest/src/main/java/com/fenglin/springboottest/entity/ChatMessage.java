package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单聊天消息，对应数据表 chat_message。
 * senderType：user = 用户，merchant = 商家。
 */
@Data
@TableName("chat_message")
public class ChatMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 会话 id */
    private Long conversationId;

    /** 发送方：user / merchant */
    private String senderType;

    /** 发送方展示名快照 */
    private String senderName;

    /** 消息内容 */
    private String content;

    private LocalDateTime createdAt;
}
