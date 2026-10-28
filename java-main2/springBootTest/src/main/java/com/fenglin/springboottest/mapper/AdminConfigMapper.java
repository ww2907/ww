package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.AdminConfig;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminConfigMapper extends BaseMapper<AdminConfig> {
}
