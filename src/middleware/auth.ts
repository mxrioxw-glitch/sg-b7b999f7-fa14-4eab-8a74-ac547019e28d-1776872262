import { GetServerSidePropsContext } from "next";
import { authService } from "@/services/authService";

export async function requireAuth(context: GetServerSidePropsContext) {
  try {
    const session = await authService.getCurrentSession();

    if (!session?.user) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: session.user,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}

export async function requireSuperAdmin(context: GetServerSidePropsContext) {
  try {
    const session = await authService.getCurrentSession();

    if (!session?.user) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    // Check if user is super admin
    if (session.user.email !== "mxrioxw@gmail.com") {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: session.user,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }
}