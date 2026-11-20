package com.fenglin.springboottest.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenglin.springboottest.common.BusinessException;
import com.fenglin.springboottest.controller.dto.DirectOrderItemDTO;
import com.fenglin.springboottest.controller.dto.DirectOrderRequest;
import com.fenglin.springboottest.controller.dto.OrderCreateRequest;
import com.fenglin.springboottest.controller.dto.OrderItemDTO;
import com.fenglin.springboottest.entity.Dish;
import com.fenglin.springboottest.entity.Order;
import com.fenglin.springboottest.entity.OrderItem;
import com.fenglin.springboottest.entity.Restaurant;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.entity.UserAddress;
import com.fenglin.springboottest.mapper.DishMapper;
import com.fenglin.springboottest.mapper.OrderItemMapper;
import com.fenglin.springboottest.mapper.OrderMapper;
import com.fenglin.springboottest.mapper.RestaurantMapper;
import com.fenglin.springboottest.mapper.UserAddressMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import com.fenglin.springboottest.service.OrderService;
import com.fenglin.springboottest.vo.FrequentFoodVO;
import com.fenglin.springboottest.vo.OrderItemVO;
import com.fenglin.springboottest.vo.OrderStatsVO;
import com.fenglin.springboottest.vo.OrderVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

/**
 * 订单业务实现：
 *   - 购物车结算：校验店铺 + 明细 + **收货地址**，按前端带入的金额算总额，落库主表与明细表。
 *   - 立即下单：跳过购物车，按 dishId 反查菜品，**由后端核价**（基础价 + 规格加价）后落库。
 *   - 查询订单：按账号倒序返回订单与明细。
 */
@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final OrderItemMapper orderItemMapper;
    private final UserMapper userMapper;
    private final RestaurantMapper restaurantMapper;
    private final UserAddressMapper userAddressMapper;
    private final DishMapper dishMapper;

    public OrderServiceImpl(OrderItemMapper orderItemMapper,
                            UserMapper userMapper,
                            RestaurantMapper restaurantMapper,
                            UserAddressMapper userAddressMapper,
                            DishMapper dishMapper) {
        this.orderItemMapper = orderItemMapper;
        this.userMapper = userMapper;
        this.restaurantMapper = restaurantMapper;
        this.userAddressMapper = userAddressMapper;
        this.dishMapper = dishMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO createOrder(OrderCreateRequest req) {
        if (req == null || req.getRestaurantId() == null) {
            throw new BusinessException("缺少店铺信息，无法下单");
        }
        Restaurant restaurant = restaurantMapper.selectById(req.getRestaurantId());
        if (restaurant == null) {
            throw new BusinessException(404, "店铺不存在");
        }
        List<OrderItemDTO> items = req.getItems();
        if (items == null || items.isEmpty()) {
            throw new BusinessException("购物车为空，无法下单");
        }

        // 解析下单用户（按账号匹配，匹配不到则仅保留账号文本）
        Long userId = null;
        String account = req.getAccount();
        if (account != null && !account.trim().isEmpty()) {
            account = account.trim();
            User u = userMapper.selectOne(new QueryWrapper<User>().eq("account", account));
            if (u != null) {
                userId = u.getId();
            }
        } else {
            account = "";
        }

        // 过滤无效项（数量 <= 0 的直接丢弃）
        List<OrderItemDTO> validItems = new ArrayList<>();
        for (OrderItemDTO it : items) {
            int qty = (it.getQty() == null) ? 0 : it.getQty();
            if (qty <= 0) {
                continue;
            }
            validItems.add(it);
        }
        if (validItems.isEmpty()) {
            throw new BusinessException("购物车为空，无法下单");
        }

        // 收货地址：没地址就不允许下单（"请先填写收货地址"）
        // 优先用前端传来的 addressId，其次取该账号的默认地址，最后退到最早一条；
        // 都拿不到说明这个账号还没维护过地址 → 直接拦下。
        UserAddress address = resolveAddress(req.getAddressId(), account);

        return saveOrder(userId, account, restaurant, req.getRestaurantName(), validItems, address);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderVO createDirectOrder(DirectOrderRequest req) {
        if (req == null || req.getRestaurantId() == null) {
            throw new BusinessException("缺少店铺信息，无法下单");
        }
        Restaurant restaurant = restaurantMapper.selectById(req.getRestaurantId());
        if (restaurant == null) {
            throw new BusinessException(404, "店铺不存在");
        }
        if (restaurant.getOpenStatus() != null && restaurant.getOpenStatus() == 0) {
            throw new BusinessException("店铺已打烊，暂不接单");
        }
        List<DirectOrderItemDTO> items = req.getItems();
        if (items == null || items.isEmpty()) {
            throw new BusinessException("请先选择菜品，再下单");
        }

        // 解析下单用户（与购物车下单口径一致）
        Long userId = null;
        String account = req.getAccount();
        if (account != null && !account.trim().isEmpty()) {
            account = account.trim();
            User u = userMapper.selectOne(new QueryWrapper<User>().eq("account", account));
            if (u != null) {
                userId = u.getId();
            }
        } else {
            account = "";
        }

        // 核价：单价 = 菜品基础价 + 规格加价（规格按 dish.specs JSON 里匹配到的选项累加）
        List<OrderItemDTO> validItems = new ArrayList<>();
        for (DirectOrderItemDTO it : items) {
            if (it == null || it.getDishId() == null) {
                continue;
            }
            int qty = (it.getQty() == null) ? 0 : it.getQty();
            if (qty <= 0) {
                continue;
            }
            Dish dish = dishMapper.selectById(it.getDishId());
            if (dish == null) {
                throw new BusinessException("菜品不存在或已下架，请重新选择");
            }
            if (!Objects.equals(dish.getRestaurantId(), restaurant.getId())) {
                throw new BusinessException("菜品「" + dish.getName() + "」不属于该店铺");
            }
            String specText = (it.getSpecText() == null) ? "" : it.getSpecText().trim();
            BigDecimal base = (dish.getPrice() == null) ? BigDecimal.ZERO : dish.getPrice();
            BigDecimal price = base.add(specSurcharge(dish.getSpecs(), specText));

            OrderItemDTO oi = new OrderItemDTO();
            oi.setDishId(dish.getId());
            // 明细名称带规格，与购物车下单的展示口径保持一致：菜名（规格）
            oi.setName(specText.isEmpty() ? dish.getName() : dish.getName() + "（" + specText + "）");
            oi.setPrice(price);
            oi.setQty(qty);
            validItems.add(oi);
        }
        if (validItems.isEmpty()) {
            throw new BusinessException("请先选择菜品，再下单");
        }

        UserAddress address = resolveAddress(req.getAddressId(), account);

        return saveOrder(userId, account, restaurant, req.getRestaurantName(), validItems, address);
    }

    /**
     * 统一的落库入口：计算总额/件数 → 写订单主表（含地址快照）→ 写明细 → 转 VO。
     * 购物车下单与立即下单共用，保证两种入口写出来的订单结构完全一致。
     */
    private OrderVO saveOrder(Long userId, String account, Restaurant restaurant, String restaurantName,
                              List<OrderItemDTO> items, UserAddress address) {
        BigDecimal total = BigDecimal.ZERO;
        int itemCount = 0;
        for (OrderItemDTO it : items) {
            BigDecimal price = (it.getPrice() == null) ? BigDecimal.ZERO : it.getPrice();
            total = total.add(price.multiply(BigDecimal.valueOf(it.getQty())));
            itemCount += it.getQty();
        }

        // 落库主表
        Order order = new Order();
        order.setOrderNo(genOrderNo());
        order.setUserId(userId);
        order.setAccount(account);
        order.setRestaurantId(restaurant.getId());
        order.setRestaurantName(restaurantName != null && !restaurantName.trim().isEmpty()
                ? restaurantName.trim() : restaurant.getName());
        order.setTotalAmount(total);
        order.setItemCount(itemCount);
        // 提交订单即支付：新单直接落「已支付」，不再有独立的待支付步骤。
        // status=0 仅保留给库里的历史订单，仍可通过 /status?status=1 或 3 收尾。
        order.setStatus(1);
        // 地址以「快照」写入订单：之后用户改/删地址，历史订单不受影响
        order.setReceiverName(address.getName() == null ? "" : address.getName());
        order.setReceiverPhone(address.getPhone() == null ? "" : address.getPhone());
        order.setAddress(fullAddressOf(address));
        // 显式写入下单时间：MySQL 的 DEFAULT CURRENT_TIMESTAMP 不会回填到实体，
        // 不设置会导致「下单成功」返回的 createdAt 为空串
        order.setCreatedAt(LocalDateTime.now());
        baseMapper.insert(order);

        // 落库明细
        Long orderId = order.getId();
        List<OrderItemVO> itemVos = new ArrayList<>();
        for (OrderItemDTO it : items) {
            BigDecimal price = (it.getPrice() == null) ? BigDecimal.ZERO : it.getPrice();
            int qty = it.getQty();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));

            OrderItem oi = new OrderItem();
            oi.setOrderId(orderId);
            oi.setDishId(it.getDishId());
            oi.setDishName(it.getName());
            oi.setPrice(price);
            oi.setQty(qty);
            oi.setSubtotal(subtotal);
            orderItemMapper.insert(oi);

            OrderItemVO vo = new OrderItemVO();
            vo.setDishId(oi.getDishId());
            vo.setDishName(oi.getDishName());
            vo.setPrice(oi.getPrice());
            vo.setQty(oi.getQty());
            vo.setSubtotal(oi.getSubtotal());
            itemVos.add(vo);
        }

        return toVO(order, itemVos);
    }

    /**
     * 规格加价：在 dish.specs（[{name,type,options:[{label,price}]}]）里，
     * 找出出现在 specText 中的选项，把它们的 price 累加。
     *
     * 说明：specText 是前端按「 / 」「、」拼起来的规格文案，这里只按「选项名出现在文案里」匹配，
     * 匹配不到就按 0 处理 —— 即后端最多按基础价收，绝不会因为前端改价而多收。
     */
    private BigDecimal specSurcharge(String specsJson, String specText) {
        if (specsJson == null || specsJson.trim().isEmpty()
                || specText == null || specText.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            List<Map<String, Object>> raw = OBJECT_MAPPER.readValue(
                    specsJson, new TypeReference<List<Map<String, Object>>>() {});
            if (raw == null) {
                return BigDecimal.ZERO;
            }
            BigDecimal sum = BigDecimal.ZERO;
            for (Map<String, Object> group : raw) {
                Object optsRaw = group.get("options");
                if (!(optsRaw instanceof List)) {
                    continue;
                }
                for (Object o : (List<?>) optsRaw) {
                    if (!(o instanceof Map)) {
                        continue;
                    }
                    Map<?, ?> om = (Map<?, ?>) o;
                    Object label = om.get("label");
                    Object price = om.get("price");
                    if (label == null || price == null) {
                        continue;
                    }
                    String text = String.valueOf(label).trim();
                    if (text.isEmpty() || !specText.contains(text)) {
                        continue;
                    }
                    try {
                        sum = sum.add(new BigDecimal(String.valueOf(price)));
                    } catch (NumberFormatException ignore) {
                        // 价格字段异常时忽略该选项加价
                    }
                }
            }
            return sum;
        } catch (Exception e) {
            // specs JSON 不合法 / 解析失败：不加价，按基础价下单
            return BigDecimal.ZERO;
        }
    }


    @Override
    public List<OrderVO> listByAccount(String account, Integer status) {
        List<OrderVO> result = new ArrayList<>();
        if (account == null || account.trim().isEmpty()) {
            return result;
        }
        QueryWrapper<Order> qw = new QueryWrapper<Order>()
                .eq("account", account.trim())
                .orderByDesc("id");
        // 状态过滤：0=待支付 1=已支付 2=已完成 3=已取消
        if (status != null) {
            qw.eq("status", status);
        }
        List<Order> orders = baseMapper.selectList(qw);
        for (Order o : orders) {
            List<OrderItem> its = orderItemMapper.selectList(
                    new QueryWrapper<OrderItem>().eq("order_id", o.getId()));
            List<OrderItemVO> itemVos = new ArrayList<>();
            for (OrderItem oi : its) {
                OrderItemVO vo = new OrderItemVO();
                // dishId 必须回传：前端「再来一单」按 dishId 还原购物车，缺失会导致加购失败
                vo.setDishId(oi.getDishId());
                vo.setDishName(oi.getDishName());
                vo.setPrice(oi.getPrice());
                vo.setQty(oi.getQty());
                vo.setSubtotal(oi.getSubtotal());
                itemVos.add(vo);
            }
            result.add(toVO(o, itemVos));
        }
        return result;
    }

    @Override
    public OrderStatsVO getStats(String account) {
        OrderStatsVO stats = new OrderStatsVO();
        if (account == null || account.trim().isEmpty()) {
            stats.setTotalOrders(0);
            stats.setUnpaidCount(0);
            stats.setPaidCount(0);
            stats.setCompletedCount(0);
            stats.setCancelledCount(0);
            stats.setFrequentFoods(new ArrayList<>());
            return stats;
        }
        List<Order> orders = baseMapper.selectList(
                new QueryWrapper<Order>().eq("account", account.trim()));
        int unpaid = 0, paid = 0, completed = 0, cancelled = 0;
        for (Order o : orders) {
            Integer s = o.getStatus();
            if (s == null) continue;
            switch (s) {
                case 0: unpaid++; break;
                case 1: paid++; break;
                case 2: completed++; break;
                case 3: cancelled++; break;
                default: break;
            }
        }
        stats.setUnpaidCount(unpaid);
        stats.setPaidCount(paid);
        stats.setCompletedCount(completed);
        stats.setCancelledCount(cancelled);
        stats.setTotalOrders(orders.size());

        // 常点食物：按账号聚合订单明细
        List<FrequentFoodVO> frequent = baseMapper.selectFrequentFoods(account.trim(), 10);
        stats.setFrequentFoods(frequent == null ? new ArrayList<>() : frequent);
        return stats;
    }

    @Override
    public OrderVO getById(Long id) {
        if (id == null) {
            throw new BusinessException(404, "订单不存在");
        }
        Order order = baseMapper.selectById(id);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        List<OrderItem> its = orderItemMapper.selectList(
                new QueryWrapper<OrderItem>().eq("order_id", order.getId()));
        List<OrderItemVO> itemVos = new ArrayList<>();
        for (OrderItem oi : its) {
            OrderItemVO vo = new OrderItemVO();
            vo.setDishId(oi.getDishId());
            vo.setDishName(oi.getDishName());
            vo.setPrice(oi.getPrice());
            vo.setQty(oi.getQty());
            vo.setSubtotal(oi.getSubtotal());
            itemVos.add(vo);
        }
        return toVO(order, itemVos);
    }

    @Override
    public OrderVO updateStatus(Long id, Integer status) {
        if (id == null) {
            throw new BusinessException("缺少订单信息");
        }
        if (status == null || status < 1 || status > 3) {
            throw new BusinessException("非法的订单状态");
        }
        Order order = baseMapper.selectById(id);
        if (order == null) {
            throw new BusinessException(404, "订单不存在");
        }
        Integer cur = order.getStatus();
        // 终态不可变
        if (cur == 2) throw new BusinessException("订单已完成，无法再变更");
        if (cur == 3) throw new BusinessException("订单已取消，无法再变更");
        // 流转校验
        if (status == 1 && cur != 0) throw new BusinessException("仅待支付订单可以支付");
        if (status == 2 && cur != 1) throw new BusinessException("仅已支付订单可以标记完成");
        if (status == 3 && cur == 2) throw new BusinessException("订单已完成，无法取消");

        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());
        baseMapper.updateById(order);

        List<OrderItem> its = orderItemMapper.selectList(
                new QueryWrapper<OrderItem>().eq("order_id", order.getId()));
        List<OrderItemVO> itemVos = new ArrayList<>();
        for (OrderItem oi : its) {
            OrderItemVO vo = new OrderItemVO();
            vo.setDishId(oi.getDishId());
            vo.setDishName(oi.getDishName());
            vo.setPrice(oi.getPrice());
            vo.setQty(oi.getQty());
            vo.setSubtotal(oi.getSubtotal());
            itemVos.add(vo);
        }
        return toVO(order, itemVos);
    }

    /**
     * 解析下单用的收货地址。
     *
     * 查找顺序：
     *   1. 前端显式传的 addressId（校验归属，防止拿别人地址下单）
     *   2. 该账号的默认地址（is_default = 1）
     *   3. 该账号最早创建的一条地址
     * 三条都落空 → 抛业务异常，前端据此提示「请先填写收货地址」。
     */
    private UserAddress resolveAddress(Long addressId, String account) {
        UserAddress addr = null;
        if (addressId != null) {
            addr = userAddressMapper.selectById(addressId);
            if (addr == null) {
                throw new BusinessException("收货地址不存在，请重新选择");
            }
            if (account != null && !account.isEmpty() && !account.equals(addr.getAccount())) {
                throw new BusinessException("该收货地址不属于当前账号");
            }
        }
        if (addr == null && account != null && !account.isEmpty()) {
            addr = userAddressMapper.selectOne(new QueryWrapper<UserAddress>()
                    .eq("account", account)
                    .eq("is_default", 1)
                    .orderByAsc("id")
                    .last("LIMIT 1"));
            if (addr == null) {
                addr = userAddressMapper.selectOne(new QueryWrapper<UserAddress>()
                        .eq("account", account)
                        .orderByAsc("id")
                        .last("LIMIT 1"));
            }
        }
        if (addr == null) {
            throw new BusinessException("请先填写收货地址，再提交订单");
        }
        String full = fullAddressOf(addr);
        if (full.isEmpty()) {
            throw new BusinessException("收货地址不完整，请补充详细地址后再下单");
        }
        return addr;
    }

    /** 省 市 详细地址 拼成一行（空段自动跳过） */
    private String fullAddressOf(UserAddress a) {
        if (a == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (String part : new String[]{a.getProvince(), a.getCity(), a.getDetail()}) {
            if (part != null && !part.trim().isEmpty()) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(part.trim());
            }
        }
        return sb.toString();
    }

    private OrderVO toVO(Order o, List<OrderItemVO> itemVos) {
        OrderVO vo = new OrderVO();
        vo.setId(o.getId());
        vo.setOrderNo(o.getOrderNo());
        vo.setRestaurantId(o.getRestaurantId());
        vo.setRestaurantName(o.getRestaurantName());
        vo.setTotalAmount(o.getTotalAmount());
        vo.setItemCount(o.getItemCount());
        vo.setStatus(o.getStatus());
        vo.setStatusText(statusText(o.getStatus()));
        vo.setReceiverName(o.getReceiverName());
        vo.setReceiverPhone(o.getReceiverPhone());
        vo.setAddress(o.getAddress());
        vo.setItems(itemVos);
        vo.setCreatedAt(o.getCreatedAt() == null ? ""
                : o.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        return vo;
    }

    private String statusText(Integer status) {
        if (status == null) return "未知";
        switch (status) {
            case 0: return "待支付";
            case 1: return "已支付";
            case 2: return "已完成";
            case 3: return "已取消";
            default: return "未知";
        }
    }

    private String genOrderNo() {
        // 时间戳 + 4 位随机数，保证可读且基本唯一
        return System.currentTimeMillis() + "" + (1000 + new Random().nextInt(9000));
    }
}
