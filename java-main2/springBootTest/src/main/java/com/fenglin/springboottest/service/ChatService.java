package com.fenglin.springboottest.service;

import com.fenglin.springboottest.vo.ChatConversationVO;
import com.fenglin.springboottest.vo.ChatMessageVO;

import java.util.List;

/**
 * 订单聊天：用户按订单找商家沟通，后台客服台统一回复。
 * 一单一会话（chat_conversation.order_id 唯一），消息按时间正序返回。
 */
public interface ChatService {

    /** 用户打开某笔订单的会话：不存在则创建并写入一条商家欢迎语 */
    ChatConversationVO openConversation(Long orderId, String account);

    /** 用户侧会话列表（按最后消息时间倒序） */
    List<ChatConversationVO> listByAccount(String account);

    /** 用户侧消息列表；校验会话归属，并把 user_unread 清零 */
    List<ChatMessageVO> listMessages(Long conversationId, String account);

    /** 用户发消息：写入 user 消息，商家未读 +1 */
    ChatMessageVO sendUserMessage(Long conversationId, String account, String content);

    /** 后台：全部会话列表 */
    List<ChatConversationVO> listAllConversations();

    /** 后台：消息列表；把 merchant_unread 清零 */
    List<ChatMessageVO> listAdminMessages(Long conversationId);

    /** 后台：商家回复；写入 merchant 消息，用户未读 +1 */
    ChatMessageVO sendMerchantMessage(Long conversationId, String content);
}
