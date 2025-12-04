import prisma from "@/lib/db";

const HomePage = async () => {
  const user = await prisma.user.findMany();
  return (
    <div className=" text-red-400">
      {JSON.stringify(user)}
    </div>
  );
}


export default HomePage;