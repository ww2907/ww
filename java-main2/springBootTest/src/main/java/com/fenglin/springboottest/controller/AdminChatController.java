package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.common.Result;
import com.fenglin.springboottest.controller.dto.ChatSendRequest;
import com.fenglin.springboottest.service.ChatService;
import com.fenglin.springboottest.vo.ChatConversationVO;
import com.fenglin.springboottest.vo.ChatMessageVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 后台客服消息接口，挂在 /api/admin/chat 下：
 *   GET  /api/admin/chat/conversations                    全部订单会话
 *   GET  /api/admin/chat/conversations/{id}/messages      会话消息（顺带清商家未读）
 *   POST /api/admin/chat/conversations/{id}/messages      商家回复
 */
@RestController
@RequestMapping("/api/admin/chat")
public class AdminChatController {

    private final ChatService chatService;

    public AdminChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public Result<List<ChatConversationVO>> list() {
        return Result.success(chatService.listAllConversations());
    }

    @GetMapping("/conversations/{id}/messages")
    public Result<List<ChatMessageVO>> messages(@PathVariable Long id) {
        return Result.success(chatService.listAdminMessages(id));
    }

    @PostMapping("/conversations/{id}/messages")
    public Result<ChatMessageVO> send(@PathVariable Long id, @RequestBody ChatSendRequest req) {
        return Result.success(chatService.sendMerchantMessage(
                id,
                req == null ? null : req.getContent()));
    }
}
