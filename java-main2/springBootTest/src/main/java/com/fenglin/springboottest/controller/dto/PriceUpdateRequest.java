package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 单条菜品改价请求：{ price: 12.50 }
 */
@Data
public class PriceUpdateRequest {
    private BigDecimal price;
}
