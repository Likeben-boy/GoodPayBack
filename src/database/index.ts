// 导出Prisma相关功能
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    //新增user表的内容
    console.log('开始插入数据');
    
    // await prisma.users.create({
    //     data: {
    //         username:"小吴",
    //         email:"849808229@qq.com",
    //         phone:"18387136032",
    //         password:"wuheng1997516"
    //     }
    // })

    const user = await prisma.users.update({
        where:{id:2},
        data:{username:'likeben'}
    })

    console.log('更新的用户',user);
    

    const allUsers = await prisma.users.findMany();

    console.log('所有数据是',allUsers);

}

main()
  .then(async () => {
    await prisma.$disconnect;
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
