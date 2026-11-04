package com.fenglin.springboottest.controller.dto;

import lombok.Data;

/**
 * 新增 / 编辑收货地址请求体。
 * POST /api/users/addresses、PUT /api/users/addresses/{id}
 */
@Data
public class UserAddressRequest {

    /** 所属账号（新增必填；编辑时用于校验归属） */
    private String account;

    private String name;

    private String phone;

    private String tag;

    private String province;

    private String city;

    private String detail;

    /** 是否设为默认地址 */
    private Boolean isDefault;
}
