package com.fenglin.springboottest.controller.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 批量改价请求：
 *  - mode = "rate"：价格 = 现价 × value（百分比系数，须 > 0）
 *  - mode = "add" ：价格 = 现价 + value（可正可负）
 *  - mode = "set" ：价格 = value（统一设定）
 */
@Data
public class PriceBatchRequest {
    private String mode;
    private BigDecimal value;
    private List<Long> ids;
}
