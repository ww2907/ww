package com.fenglin.springboottest.common;

/**
 * 业务异常：携带业务错误码与中文提示信息，由全局异常处理器转换为统一返回。
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(String message) {
        this(1, message);
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
