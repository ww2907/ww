"""以分离进程启动/重启后端（不受 AI 会话回收影响）。

用法：
    python restart_backend.py          # 启动（默认 8081）
    python restart_backend.py 8081     # 指定端口
本机 mvnw/mvn 脚本坏掉、package 插件离线缺依赖，所以直接用
classworlds launcher + spring-boot:run，并把进程 DETACHED 出去。
"""
import os
import subprocess
import sys
import time

M = r"C:/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.16-bin/5grr65jo27hi51sujmtcldfovl/apache-maven-3.9.16"
JAVA = r"C:/Program Files/Java/jdk-17/bin/java.exe"
PROJ = os.path.dirname(os.path.abspath(__file__))
PORT = sys.argv[1] if len(sys.argv) > 1 else "8081"
DETACHED = 0x00000008 | 0x00000200


def main():
    env = dict(os.environ)
    # 关键坑：IDE 注入的 SERVER__PORT 会被 Spring 松散绑定成 server.port
    env.pop("SERVER__PORT", None)
    env["JAVA_HOME"] = r"C:/Program Files/Java/jdk-17"
    cmd = [
        JAVA,
        "-classpath", M + "/boot/plexus-classworlds-2.11.0.jar",
        "-Dclassworlds.conf=" + M + "/bin/m2.conf",
        "-Dmaven.home=" + M,
        "-Dmaven.multiModuleProjectDirectory=" + PROJ.replace("\\", "/"),
        "org.codehaus.plexus.classworlds.launcher.Launcher",
        "-o", "spring-boot:run",
        "-Dspring-boot.run.profiles=dev",
        "-Dspring-boot.run.arguments=--server.port=" + PORT,
    ]
    os.makedirs(os.path.join(PROJ, "log"), exist_ok=True)
    log_path = os.path.join(PROJ, "log", "run_be.log")
    with open(log_path, "wb") as f:
        p = subprocess.Popen(cmd, cwd=PROJ, env=env, stdout=f,
                             stderr=subprocess.STDOUT,
                             creationflags=DETACHED, close_fds=True)
    print("backend pid = %d  (port %s)" % (p.pid, PORT))
    # 轮询健康检查
    import urllib.request
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    url = "http://127.0.0.1:%s/api/restaurants/categories" % PORT
    for i in range(90):
        time.sleep(1)
        try:
            with opener.open(url, timeout=2) as r:
                if r.status == 200:
                    print("backend ready after %ds" % (i + 1))
                    return
        except Exception:
            pass
    print("WARN: backend not ready in 90s, see", log_path)


if __name__ == "__main__":
    main()
