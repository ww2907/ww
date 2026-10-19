package com.fenglin.springboottest.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.fenglin.springboottest.mapper")
public class MybatisPlusConfig {
    // 基础 CRUD 由 MyBatis-Plus 的 BaseMapper / IService 提供，无需额外拦截器。
    // 如需分页，可在此注入 MybatisPlusInterceptor + PaginationInnerInterceptor。
}
