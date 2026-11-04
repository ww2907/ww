package com.fenglin.springboottest.vo;

import lombok.Data;

/**
 * 收货地址展示对象，字段与前端 src/store/profile.js 的地址结构一致。
 * isDefault 对外使用 boolean（数据库为 tinyint 1/0）。
 */
@Data
public class UserAddressVO {

    private Long id;

    private String account;

    private String name;

    private String phone;

    private String tag;

    private String province;

    private String city;

    private String detail;

    private Boolean isDefault;
}
