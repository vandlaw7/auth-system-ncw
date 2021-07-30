import React from "react";
import Router from "next/router";
import {signOut} from "next-auth/client";

export type WalletProps = {
    id: string;
    address: string;
    chain: string;
};


async function removeWallet(id: String): Promise<void> {
    const response = await fetch(`https://auth-system-ncw.vercel.app/api/wallet/${id}`, {
        method: 'DELETE',
    });
    Router.push('/');
    const response_json = await response.json()
    // 마지막 남은 계좌를 삭제하면 해당 유저가 삭제되고 자동으로 로그아웃됨.
    if (response_json.user_delete){
        signOut()
    }
}


const Wallet: React.FC<{ wallet: WalletProps }> = ({wallet}) => {
    return (
        <div>
            <h2>{wallet.chain}</h2>
            <p>{wallet.address}</p>
            <button onClick={() => removeWallet(wallet.id)}>remove wallet</button>
            <style jsx>{`
        div {
          color: inherit;
          padding: 2rem;
        }
      `}</style>
        </div>
    );
};

export default Wallet;
