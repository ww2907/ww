package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.ChatOpenRequest;
import com.fenglin.springboottest.controller.dto.ChatSendRequest;
import com.fenglin.springboottest.service.ChatService;
import com.fenglin.springboottest.vo.ChatConversationVO;
import com.fenglin.springboottest.vo.ChatMessageVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户端订单聊天接口，统一挂在 /api/chat 下，与前端 src/api/chat.js 的约定一致：
 *   POST /api/chat/conversations                      打开（或创建）某笔订单的会话
 *   GET  /api/chat/conversations?account=             我的会话列表
 *   GET  /api/chat/conversations/{id}/messages?account= 会话消息（顺带清用户未读）
 *   POST /api/chat/conversations/{id}/messages        发送消息
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/conversations")
    public Result<ChatConversationVO> open(@RequestBody ChatOpenRequest req) {
        return Result.success(chatService.openConversation(
                req == null ? null : req.getOrderId(),
                req == null ? null : req.getAccount()));
    }

    @GetMapping("/conversations")
    public Result<List<ChatConversationVO>> list(@RequestParam String account) {
        return Result.success(chatService.listByAccount(account));
    }

    @GetMapping("/conversations/{id}/messages")
    public Result<List<ChatMessageVO>> messages(@PathVariable Long id, @RequestParam String account) {
        return Result.success(chatService.listMessages(id, account));
    }

    @PostMapping("/conversations/{id}/messages")
    public Result<ChatMessageVO> send(@PathVariable Long id, @RequestBody ChatSendRequest req) {
        return Result.success(chatService.sendUserMessage(
                id,
                req == null ? null : req.getAccount(),
                req == null ? null : req.getContent()));
    }
}
