package com.fenglin.springboottest.vo;

import lombok.Data;

import java.util.List;

/**
 * 菜品规格项展示对象（分量 / 辣度 / 加料等）。
 * 结构对应 dish.specs JSON 中的一个元素：
 *   { name: "分量", type: "single"|"multi", options: [{ label, price }] }
 * type=single 单选（分量/辣度），type=multi 多选（加料）。
 */
@Data
public class DishSpecVO {

    /** 规格名称，如「分量」「辣度」「加料」 */
    private String name;

    /** 选择类型：single=单选 multi=多选 */
    private String type;

    /** 规格选项 */
    private List<DishSpecOptionVO> options;
}
