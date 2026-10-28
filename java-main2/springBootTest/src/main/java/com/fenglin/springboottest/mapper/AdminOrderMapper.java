package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.AdminOrder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminOrderMapper extends BaseMapper<AdminOrder> {
}
