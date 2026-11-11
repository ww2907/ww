package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fenglin.springboottest.entity.Restaurant;
import com.fenglin.springboottest.vo.CategoryTreeVO;
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

    /**
     * 按分类 id 做分级分类搜索（推荐用法）。
     * categoryId 命中该分类的整棵子树：一级=全部美食，二级=该业态下所有品类，
     * 三级=具体品类（通过 dish.category_id 反查出「有该品类菜品的店铺」）。
     * @param keyword    关键字，可空
     * @param categoryId 分类 id，为空表示不限分类
     * @param sort       排序字段：default / price / distance
     * @param order      排序方向：asc / desc
     */
    List<RestaurantVO> search(String keyword, Long categoryId, String sort, String order);

    /** 分类列表（第一个元素固定为 "全部"，之后为数据库中的分类，含分级父分类） */
    List<String> categories();

    /**
     * 分级分类树：三级结构（L1 美食 → L2 业态 → L3 品类），带店铺数与菜品数汇总。
     * 前端分类筛选直接消费该结构，点哪一级就传哪个节点的 id 回来。
     */
    List<CategoryTreeVO> categoryTree();

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

    /**
     * 美食页列表 + 按分类 id 的分级筛选（与 search 同一套子树口径）。
     * @param keyword    关键字，可空
     * @param categoryId 分类 id，为空表示不限分类
     * @param sort       排序字段：default / price / distance
     * @param order      排序方向：asc / desc
     */
    List<RestaurantVO> foodList(String keyword, Long categoryId, String sort, String order);

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
