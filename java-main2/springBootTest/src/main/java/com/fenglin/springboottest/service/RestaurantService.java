package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.fenglin.springboottest.entity.Restaurant;
import com.fenglin.springboottest.vo.RestaurantDetailVO;
import com.fenglin.springboottest.vo.RestaurantVO;

import java.util.List;

/**
 * 店铺业务：首页展示、分级分类搜索、店铺详情（含菜单与评论）。
 */
public interface RestaurantService extends IService<Restaurant> {

    /**
     * 首页店铺列表 / 搜索。
     * @param keyword  关键字（匹配店名、简介、标签），可空
     * @param category 分类名称（支持分级：传入父分类会包含其下所有子分类），可空或 "全部"
     * @return 店铺展示列表
     */
    List<RestaurantVO> search(String keyword, String category);

    /** 分类列表（第一个元素固定为 "全部"，之后为数据库中的分类，含分级父分类） */
    List<String> categories();

    /** 店铺详情：含店内菜单、用户评价、平均评分与评价数 */
    RestaurantDetailVO detail(Long id);
}
