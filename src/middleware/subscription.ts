import { GetServerSidePropsContext } from "next";

// Dummy middleware to prevent import errors across the app
export async function requireActiveSubscription(context: GetServerSidePropsContext) {
  return {
    props: {},
  };
}