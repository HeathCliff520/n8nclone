import { Trpcclientsidetestcomponent } from "./trpcClienttestcomponent";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";

import { Suspense } from "react";


const HomePage = async() => {
  const queryClient = getQueryClient();
  // Server-side 预缓存数据
  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());
  return (
    <div className=" text-red-400">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<div>Loading...</div>}>
          {/* 服务端引入客户端组件 */}
          <Trpcclientsidetestcomponent />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}


export default HomePage;