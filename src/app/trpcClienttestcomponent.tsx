"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Trpcclientsidetestcomponent = () => {
    const trpc = useTRPC();
    const { data: users } = useSuspenseQuery(trpc.getUsers.queryOptions());
    return (
      <div className=" text-blue-400">
        trpcclientsidetestcomponent: {JSON.stringify(users)}
      </div>
    );
};