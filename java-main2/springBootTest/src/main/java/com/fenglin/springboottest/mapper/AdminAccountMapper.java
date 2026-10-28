package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.AdminAccount;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminAccountMapper extends BaseMapper<AdminAccount> {
}
