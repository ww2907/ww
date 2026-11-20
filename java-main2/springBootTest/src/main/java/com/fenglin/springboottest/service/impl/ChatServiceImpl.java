package com.fenglin.springboottest.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.entity.ChatConversation;
import com.fenglin.springboottest.entity.ChatMessage;
import com.fenglin.springboottest.entity.Order;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.mapper.ChatConversationMapper;
import com.fenglin.springboottest.mapper.ChatMessageMapper;
import com.fenglin.springboottest.mapper.OrderMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import com.fenglin.springboottest.service.ChatService;
import com.fenglin.springboottest.vo.ChatConversationVO;
import com.fenglin.springboottest.vo.ChatMessageVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 订单聊天实现：
 *   - 一单一会话，order_id 唯一；首次打开自动建会话并写入商家欢迎语。
 *   - 用户只能操作自己账号的会话（后台接口不校验账号，由后台登录态控制入口）。
 *   - 未读数在拉取消息时清零：用户拉消息清 user_unread，后台拉消息清 merchant_unread。
 */
@Service
public class ChatServiceImpl implements ChatService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final int MAX_CONTENT_LENGTH = 500;

    private final ChatConversationMapper conversationMapper;
    private final ChatMessageMapper messageMapper;
    private final OrderMapper orderMapper;
    private final UserMapper userMapper;

    public ChatServiceImpl(ChatConversationMapper conversationMapper,
                           ChatMessageMapper messageMapper,
                           OrderMapper orderMapper,
                           UserMapper userMapper) {
        this.conversationMapper = conversationMapper;
        this.messageMapper = messageMapper;
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public synchronized ChatConversationVO openConversation(Long orderId, String account) {
        if (orderId == null) {
            throw new BusinessException("缺少订单信息，无法发起对话");
        }
        String acc = normalizeAccount(account);
        if (acc.isEmpty()) {
            throw new BusinessException("请先登录后再联系商家");
        }
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        String orderAccount = normalizeAccount(order.getAccount());
        if (orderAccount.isEmpty()) {
            throw new BusinessException("该订单没有关联账号，暂时无法联系商家");
        }
        if (!acc.equals(orderAccount)) {
            throw new BusinessException("无权查看该订单的会话");
        }

        ChatConversation conv = conversationMapper.selectOne(
                new QueryWrapper<ChatConversation>().eq("order_id", orderId));
        if (conv == null) {
            LocalDateTime now = LocalDateTime.now();
            conv = new ChatConversation();
            conv.setOrderId(order.getId());
            conv.setOrderNo(order.getOrderNo() == null ? "" : order.getOrderNo());
            conv.setAccount(acc);
            conv.setRestaurantId(order.getRestaurantId());
            conv.setRestaurantName(order.getRestaurantName() == null ? "" : order.getRestaurantName());
            conv.setUserName(nicknameOf(acc, order));
            conv.setLastMessage("");
            conv.setLastMessageAt(now);
            conv.setUserUnread(0);
            conv.setMerchantUnread(0);
            conv.setCreatedAt(now);
            conversationMapper.insert(conv);

            // 首条欢迎语由「商家」发出，让用户一进来就知道对面是谁
            String greeting = "您好，我是「" + conv.getRestaurantName() + "」的店家，"
                    + "关于订单 " + conv.getOrderNo() + " 有什么可以帮您？";
            ChatMessage welcome = new ChatMessage();
            welcome.setConversationId(conv.getId());
            welcome.setSenderType("merchant");
            welcome.setSenderName(conv.getRestaurantName());
            welcome.setContent(greeting);
            welcome.setCreatedAt(now);
            messageMapper.insert(welcome);

            conv.setLastMessage(greeting);
            conv.setLastMessageAt(now);
            conv.setUserUnread(1);
            conversationMapper.updateById(conv);
        }
        return toConversationVO(conv);
    }

    @Override
    public List<ChatConversationVO> listByAccount(String account) {
        List<ChatConversationVO> result = new ArrayList<>();
        String acc = normalizeAccount(account);
        if (acc.isEmpty()) {
            return result;
        }
        List<ChatConversation> list = conversationMapper.selectList(
                new QueryWrapper<ChatConversation>()
                        .eq("account", acc)
                        .orderByDesc("last_message_at")
                        .orderByDesc("id"));
        for (ChatConversation c : list) {
            result.add(toConversationVO(c));
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ChatMessageVO> listMessages(Long conversationId, String account) {
        ChatConversation conv = requireConversation(conversationId);
        String acc = normalizeAccount(account);
        if (!acc.equals(normalizeAccount(conv.getAccount()))) {
            throw new BusinessException("无权查看该会话");
        }
        List<ChatMessageVO> messages = messagesOf(conversationId);
        // 用户打开会话即视为已读
        if (conv.getUserUnread() != null && conv.getUserUnread() > 0) {
            conv.setUserUnread(0);
            conversationMapper.updateById(conv);
        }
        return messages;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatMessageVO sendUserMessage(Long conversationId, String account, String content) {
        ChatConversation conv = requireConversation(conversationId);
        String acc = normalizeAccount(account);
        if (!acc.equals(normalizeAccount(conv.getAccount()))) {
            throw new BusinessException("无权在该会话中发消息");
        }
        String text = normalizeContent(content);
        ChatMessage msg = insertMessage(conv, "user", conv.getUserName(), text);
        conv.setLastMessage(text);
        conv.setLastMessageAt(msg.getCreatedAt());
        conv.setMerchantUnread(nvl(conv.getMerchantUnread()) + 1);
        conversationMapper.updateById(conv);
        return toMessageVO(msg);
    }

    @Override
    public List<ChatConversationVO> listAllConversations() {
        List<ChatConversationVO> result = new ArrayList<>();
        List<ChatConversation> list = conversationMapper.selectList(
                new QueryWrapper<ChatConversation>()
                        .orderByDesc("last_message_at")
                        .orderByDesc("id"));
        for (ChatConversation c : list) {
            result.add(toConversationVO(c));
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ChatMessageVO> listAdminMessages(Long conversationId) {
        ChatConversation conv = requireConversation(conversationId);
        List<ChatMessageVO> messages = messagesOf(conversationId);
        // 后台打开会话即视为商家已读
        if (conv.getMerchantUnread() != null && conv.getMerchantUnread() > 0) {
            conv.setMerchantUnread(0);
            conversationMapper.updateById(conv);
        }
        return messages;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatMessageVO sendMerchantMessage(Long conversationId, String content) {
        ChatConversation conv = requireConversation(conversationId);
        String text = normalizeContent(content);
        ChatMessage msg = insertMessage(conv, "merchant", conv.getRestaurantName(), text);
        conv.setLastMessage(text);
        conv.setLastMessageAt(msg.getCreatedAt());
        conv.setUserUnread(nvl(conv.getUserUnread()) + 1);
        conversationMapper.updateById(conv);
        return toMessageVO(msg);
    }

    /** 写一条消息（时间显式赋值，避免 MySQL 默认值不回填实体导致返回空时间） */
    private ChatMessage insertMessage(ChatConversation conv, String senderType, String senderName, String content) {
        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conv.getId());
        msg.setSenderType(senderType);
        msg.setSenderName(senderName == null ? "" : senderName);
        msg.setContent(content);
        msg.setCreatedAt(LocalDateTime.now());
        messageMapper.insert(msg);
        return msg;
    }

    private List<ChatMessageVO> messagesOf(Long conversationId) {
        List<ChatMessage> list = messageMapper.selectList(
                new QueryWrapper<ChatMessage>()
                        .eq("conversation_id", conversationId)
                        .orderByAsc("id"));
        List<ChatMessageVO> result = new ArrayList<>();
        for (ChatMessage m : list) {
            result.add(toMessageVO(m));
        }
        return result;
    }

    private ChatConversation requireConversation(Long conversationId) {
        if (conversationId == null) {
            throw new BusinessException("缺少会话信息");
        }
        ChatConversation conv = conversationMapper.selectById(conversationId);
        if (conv == null) {
            throw new BusinessException(404, "会话不存在");
        }
        return conv;
    }

    private String nicknameOf(String account, Order order) {
        User u = userMapper.selectOne(new QueryWrapper<User>().eq("account", account));
        if (u != null) {
            if (u.getNickname() != null && !u.getNickname().trim().isEmpty()) {
                return u.getNickname().trim();
            }
            return account;
        }
        return order.getReceiverName() == null || order.getReceiverName().trim().isEmpty()
                ? account : order.getReceiverName().trim();
    }

    private String normalizeAccount(String account) {
        return account == null ? "" : account.trim();
    }

    private String normalizeContent(String content) {
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) {
            throw new BusinessException("消息不能为空");
        }
        if (text.length() > MAX_CONTENT_LENGTH) {
            throw new BusinessException("消息最多 " + MAX_CONTENT_LENGTH + " 字");
        }
        return text;
    }

    private int nvl(Integer v) {
        return v == null ? 0 : v;
    }

    private ChatConversationVO toConversationVO(ChatConversation c) {
        ChatConversationVO vo = new ChatConversationVO();
        vo.setId(c.getId());
        vo.setOrderId(c.getOrderId());
        vo.setOrderNo(c.getOrderNo());
        vo.setAccount(c.getAccount());
        vo.setRestaurantId(c.getRestaurantId());
        vo.setRestaurantName(c.getRestaurantName());
        vo.setUserName(c.getUserName());
        vo.setLastMessage(c.getLastMessage());
        vo.setLastMessageAt(format(c.getLastMessageAt()));
        vo.setUserUnread(nvl(c.getUserUnread()));
        vo.setMerchantUnread(nvl(c.getMerchantUnread()));
        vo.setCreatedAt(format(c.getCreatedAt()));
        return vo;
    }

    private ChatMessageVO toMessageVO(ChatMessage m) {
        ChatMessageVO vo = new ChatMessageVO();
        vo.setId(m.getId());
        vo.setConversationId(m.getConversationId());
        vo.setSenderType(m.getSenderType());
        vo.setSenderName(m.getSenderName());
        vo.setContent(m.getContent());
        vo.setCreatedAt(format(m.getCreatedAt()));
        return vo;
    }

    private String format(LocalDateTime time) {
        return time == null ? "" : time.format(TIME_FMT);
    }
}
