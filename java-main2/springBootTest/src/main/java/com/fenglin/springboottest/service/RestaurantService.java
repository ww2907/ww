package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fenglin.springboottest.entity.Restaurant;
import com.fenglin.springboottest.vo.RestaurantDetailVO;
import com.fenglin.springboottest.vo.RestaurantVO;

import java.util.List;
import java.util.Map;

/**
 * 店铺业务：首页展示、分级分类搜索、店铺详情（含菜单与评论）。
 */
public interface RestaurantService extends IService<Restaurant> {

    /** 排序字段：综合推荐（评分优先，其次距离） */
    String SORT_DEFAULT = "default";
    /** 排序字段：人均价格 */
    String SORT_PRICE = "price";
    /** 排序字段：距离 */
    String SORT_DISTANCE = "distance";

    /**
     * 首页店铺列表 / 搜索。
     * @param keyword  关键字（匹配店名、简介、标签），可空
     * @param category 分类名称（支持分级：传入父分类会包含其下所有子分类），可空或 "全部"
     * @return 店铺展示列表
     */
    List<RestaurantVO> search(String keyword, String category);

    /**
     * 搜索 + 排序（美食页 / 首页共用）。
     * @param keyword  关键字，可空
     * @param category 分类名称（支持分级），可空或 "全部"
     * @param sort     排序字段：default / price / distance，非法值按 default 处理
     * @param order    排序方向：asc / desc，非法值按 asc 处理
     */
    List<RestaurantVO> search(String keyword, String category, String sort, String order);

    /** 分类列表（第一个元素固定为 "全部"，之后为数据库中的分类，含分级父分类） */
    List<String> categories();

    /**
     * 首页「推荐美食」：返回评分最高的 limit 家店铺（评分相同按 id 升序），默认 12 家。
     * @param limit 推荐数量
     * @return 推荐店铺列表
     */
    List<RestaurantVO> recommended(int limit);

    /**
     * 美食页面店铺列表：返回「全部店铺剔除推荐集」后的其余店铺，并支持关键字与分类筛选。
     * 与 recommended 共用同一套推荐口径（评分最高的 12 家），保证首页与美食页不重复。
     * @param keyword  关键字（匹配店名、简介、标签），可空
     * @param category 分类名称（支持分级），可空或 "全部"
     * @return 美食页面店铺列表
     */
    List<RestaurantVO> foodList(String keyword, String category);

    /**
     * 美食页面列表 + 排序。
     * @param keyword  关键字，可空
     * @param category 分类名称（支持分级），可空或 "全部"
     * @param sort     排序字段：default / price / distance
     * @param order    排序方向：asc / desc
     */
    List<RestaurantVO> foodList(String keyword, String category, String sort, String order);

    /** 店铺详情：含店内菜单、用户评价、平均评分与评价数 */
    RestaurantDetailVO detail(Long id);

    /**
     * 搜索实时联想：店名 / 分类命中的店铺 + 菜品名命中的菜品。
     * 返回项：{ kind: 'restaurant'|'dish', id, name, sub, emoji }
     * @param keyword 关键字（空则返回空列表）
     * @param limit   最大条数（默认 8）
     */
    List<Map<String, Object>> suggest(String keyword, int limit);
}
