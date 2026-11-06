package com.fenglin.springboottest.vo;

import lombok.Data;

/**
 * 规格选项：{ label, price }。
 * price 为该项相对基础价的加价（元，可为 0）。
 */
@Data
public class DishSpecOptionVO {

    private String label;

    private Double price;
}
