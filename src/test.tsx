"use client";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import ReviewDialog from "@/components/reviews/review-dialog";


export default function RepoDetailClient({ repoId, fullName }: { repoId: string; fullName: string }) {

  const [filesPage, setFilesPage] = useState(1);
  const prFiles = trpc.pulls.files.useQuery(
    openPR ? { fullName, number: openPR, page: filesPage, perPage: 30 } : { fullName, number: 1, page: 1, perPage: 30 },
    { enabled: openPR !== null }
  );

  const doCreatePR = async () => {
    const head = useForkHead ? forkHead.trim() : newHead.trim();
    if (!newTitle || !newBase || !head) {
      toast.error("请完善标题、Base 与 Head");
      return;
    }
    if (useForkHead && !head.includes(":")) {
      toast.error("从 fork 选择时 Head 格式应为 owner:branch");
      return;
    }
    try {
      const res = await createPr.mutateAsync({
        fullName,
        title: newTitle,
        base: newBase,
        head,
        body: newBody || undefined,
        draft: newDraft,
      });
      setNewOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewBase("");
      setNewHead("");
      setNewDraft(false);
      setUseForkHead(false);
      setForkHead("");
      toast.success("已创建 Pull Request");
      prQuery.refetch();
      if (res?.html_url) window.open(res.html_url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "创建失败");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={tab === "pulls" ? "default" : "outline"}
          onClick={() => {
            setTab("pulls");
            setNewOpen(true);
          }}
        >
          Pull Requests
        </Button>
        <Button variant={tab === "reviews" ? "default" : "outline"} onClick={() => setTab("reviews")}>
          Reviews
        </Button>

      </div>
      {tab === "pulls" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant={state === "open" ? "default" : "outline"} onClick={() => { setState("open"); setPrPage(1); }}>
              <GitPullRequest className="size-4" />  Open
            </Button>
            <Button variant={state === "closed" ? "default" : "outline"} onClick={() => { setState("closed"); setPrPage(1); }}>
              <GitMerge className="size-4" />  Closed
            </Button>
            <Button variant={state === "all" ? "default" : "outline"} onClick={() => { setState("all"); setPrPage(1); }}>
              <GitBranch className="size-4" />  All
            </Button>
            <div className="mx-2" />
            <Button variant={sort === "updated" ? "default" : "outline"} onClick={() => { setSort("updated"); setPrPage(1); }}>
              Updated
            </Button>
            <Button variant={sort === "created" ? "default" : "outline"} onClick={() => { setSort("created"); setPrPage(1); }}>
              Created
            </Button>
            <Button variant={sort === "popularity" ? "default" : "outline"} onClick={() => { setSort("popularity"); setPrPage(1); }}>
              Popularity
            </Button>
            <Button variant={sort === "long-running" ? "default" : "outline"} onClick={() => { setSort("long-running"); setPrPage(1); }}>
              Long-running
            </Button>
            <div className="mx-2" />
            <Button variant="outline" onClick={() => setDirection(direction === "desc" ? "asc" : "desc")}>
              {direction === "desc" ? "Desc" : "Asc"}
            </Button>
            <Button variant="outline" onClick={() => prQuery.refetch()} disabled={prQuery.isFetching}>
              刷新
            </Button>
          </div>
          {prQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">加载中…</p>
          ) : prQuery.isError ? (
            <p className="text-sm text-destructive">加载失败：{(prQuery.error as any)?.message ?? "未知错误"}</p>
          ) : (prQuery.data?.items?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>暂无 Pull Request（筛选：{state}）</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {prQuery.data?.items.map((p) => (
                <li key={p.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <a className="text-primary hover:underline" href={p.html_url} target="_blank">
                        #{p.number} {p.title}
                      </a>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {p.state} {p.draft ? "· draft" : ""} ·
                        <img className="size-4 rounded-full" src={p.user.avatar_url} alt={p.user.login} />
                        {p.user.login} · <Clock className="size-4" /> {formatRelativeTime(new Date(p.created_at?.toString() ?? 0))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOpenPR(p.number)}>
                        查看
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <code className="bg-muted rounded-md flex items-center px-2 py-0.5 text-xs font-mono text-muted-foreground dark:bg-neutral-500/20 dark:text-neutral-200">
                      {p.base?.ref}
                      <ArrowLeft className="size-3 mx-1.5 text-muted-foreground/50" />
                      {p.head?.ref}
                    </code>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Plus className="size-3" /> {(p as any).added_files ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Minus className="size-3" /> {(p as any).removed_files ?? 0}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
              <div className="flex items-center justify-between pt-1">
                <Button variant="outline" onClick={() => setPrPage((p) => Math.max(1, p - 1))} disabled={prPage <= 1 || prQuery.isFetching}>
                  上一页
                </Button>
                <span className="text-xs text-muted-foreground">第 {prPage} 页</span>
                <Button variant="outline" onClick={() => setPrPage((p) => p + 1)} disabled={!prQuery.data?.hasMore || prQuery.isFetching}>
                  下一页
                </Button>
              </div>
              <Dialog open={openPR !== null} onOpenChange={(v) => { if (!v) { setOpenPR(null); setFilesPage(1); } }}>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      {prDetail.isLoading ? "加载中…" : prDetail.data ? `#${prDetail.data.number} ${prDetail.data.title}` : "未加载"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {prDetail.isLoading ? (
                      <p className="text-sm text-muted-foreground">加载中…</p>
                    ) : prDetail.isError ? (
                      <p className="text-sm text-destructive">加载失败</p>
                    ) : prDetail.data ? (
                      <>
                        <div className="text-sm whitespace-pre-wrap wrap-break-word">
                          {prDetail.data.body ?? "无描述"}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">文件变更</div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setFilesPage((p) => Math.max(1, p - 1))} disabled={filesPage <= 1 || prFiles.isFetching}>
                              上一页
                            </Button>
                            <span className="text-xs text-muted-foreground">第 {filesPage} 页</span>
                            <Button variant="outline" size="sm" onClick={() => setFilesPage((p) => p + 1)} disabled={!prFiles.data?.hasMore || prFiles.isFetching}>
                              下一页
                            </Button>
                          </div>
                        </div>
                        {prFiles.isLoading ? (
                          <p className="text-sm text-muted-foreground">加载中…</p>
                        ) : prFiles.isError ? (
                          <p className="text-sm text-destructive">加载失败</p>
                        ) : (prFiles.data?.items?.length ?? 0) === 0 ? (
                          <p className="text-sm text-muted-foreground">无文件变更</p>
                        ) : (
                          <ul className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                            {prFiles.data?.items.map((f) => (
                              <li key={f.sha + f.filename} className="rounded border p-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">{f.filename}</div>
                                  <div className="text-xs text-muted-foreground">
                                    +{f.additions} -{f.deletions}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={newOpen} onOpenChange={(v) => setNewOpen(v)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>新建 Pull Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm">标题</div>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="标题" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm">描述</div>
                      <textarea
                        className="w-full rounded-md border p-2 text-sm"
                        rows={5}
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        placeholder="描述"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-sm">Base</div>
                        <select
                          className="w-full rounded-md border p-2 text-sm"
                          value={newBase}
                          onChange={(e) => setNewBase(e.target.value)}
                        >
                          <option value="" disabled>选择 base</option>
                          {(branches.data?.items ?? []).map((b) => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Head</div>
                          <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={useForkHead}
                              onChange={(e) => setUseForkHead(e.target.checked)}
                            />
                            从 fork 选择
                          </label>
                        </div>
                        {useForkHead ? (
                          <Input
                            placeholder="owner:branch（例如 yourname:feature-x）"
                            value={forkHead}
                            onChange={(e) => setForkHead(e.target.value)}
                          />
                        ) : (
                          <select
                            className="w-full rounded-md border p-2 text-sm"
                            value={newHead}
                            onChange={(e) => setNewHead(e.target.value)}
                          >
                            <option value="" disabled>选择 head</option>
                            {(branches.data?.items ?? []).map((b) => (
                              <option key={b.name} value={b.name}>{b.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newDraft}
                        onChange={(e) => setNewDraft(e.target.checked)}
                      />
                      草稿 PR
                    </label>
                    {newBase && (useForkHead ? forkHead : newHead) ? (
                      <div className="text-xs text-muted-foreground">
                        {compare.isLoading ? "正在检查分支差异…" : compare.isError ? "无法获取分支差异" : compare.data ? (
                          compare.data.aheadBy === 0
                            ? "分支无差异，无法创建 PR（可能方向相反）"
                            : `Head 比 Base 超前 ${compare.data.aheadBy} 个提交`
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setNewOpen(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={doCreatePR}
                        disabled={
                          createPr.isPending ||
                          (compare.data && compare.data.aheadBy === 0)
                        }
                      >
                        创建
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
          <div className="space-y-2">
            <div className="flex justify-end">
              <ReviewDialog repo={{ id: 0, name: fullName.split("/")[1] ?? fullName, full_name: fullName, private: false, html_url: `https://github.com/${fullName}` }} />
            </div>
            {rvQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">加载中…</p>
            ) : (rvQuery.data?.items?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">暂无 Review</p>
            ) : (
              <ul className="space-y-2">
                {rvQuery.data?.items.map((r) => (
                  <li key={r.id} className="rounded border p-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">{r.content}</div>
                    <div className="text-xs text-muted-foreground">
                      {typeof r.rating === "number" ? `评分 ${r.rating}` : "未评分"} · {r.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between pt-1">
              <Button variant="outline" onClick={() => setRvPage((p) => Math.max(1, p - 1))} disabled={rvPage <= 1 || rvQuery.isFetching}>
                上一页
              </Button>
              <span className="text-xs text-muted-foreground">第 {rvPage} 页</span>
              <Button variant="outline" onClick={() => setRvPage((p) => p + 1)} disabled={!rvQuery.data?.hasMore || rvQuery.isFetching}>
                下一页
              </Button>
            </div>
          </div>
      )}
        </div>
      );
}
