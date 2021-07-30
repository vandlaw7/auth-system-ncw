import React, {useRef} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {signIn, signOut, useSession} from 'next-auth/client';
import Router from 'next/router';

import Web3 from "web3";

let web3: Web3 | undefined = undefined;


// metamask 에 전자서명을 요청함.
const handleSignMessage = async ({publicAddress, nonce,}: { publicAddress: string; nonce: string; }) => {
    try {
        const signature = await web3!.eth.personal.sign(
            `I am signing my one-time nonce: ${nonce}`,
            publicAddress,
            '' // MetaMask will ignore the password argument here
        );

        return {signature};
    } catch (err) {
        alert('You need to sign the message to be able to log in.')
        await Router.push('/');
    }
};

// login with metamask 처리함수
const handleClick = async () => {
    // Check if MetaMask is installed
    if (!(window as any).ethereum) {
        window.alert('Please install MetaMask first.');
        return;
    }

    if (!web3) {
        try {
            // Request account access if needed
            await (window as any).ethereum.enable();

            // We don't know window.web3 version, so we use our own instance of Web3
            // with the injected provider given by MetaMask
            web3 = new Web3((window as any).ethereum);
        } catch (error) {
            window.alert('You need to allow MetaMask.');
            return;
        }
    }
    const publicAddress = await web3.eth.getCoinbase();
    if (!publicAddress) {
        window.alert('Please activate MetaMask first.');
        return;
    }

    // 지금까지는 그냥 일반적인 체크용

    const chain = "ethereum";
    const response = await fetch(`https://auth-system-ncw.vercel.app/api/wallet`, {
        body: JSON.stringify({publicAddress, chain}),
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
    });
    const response_json = await response.json();
    console.log('response_json', response_json)
    // nonce 를 반환하면 이미 계정이 있는 유저가 메타마스크를 통해 로그인하려고 하는 것임
    if (response_json.nonce) {
        const {nonce} = response_json;
        const {signature} = await handleSignMessage({publicAddress, nonce});
        // handleAuthenticate({publicAddress, signature})

        signIn('credentials',
            {publicAddress, signature, nonce});
        Router.push('/')
    } else {
        // 이 경우 메타마스크로 처음 로그인해서 바로 유저를 생성해서 로그인함.
        const {user_id} = response_json;
        console.log("user_id in frontend", user_id);
        signIn('credentials', {user_id});
        Router.push('/')
    }
};

const Header: React.FC = () => {
    const router = useRouter();
    const isActive: (pathname: string) => boolean = (pathname) =>
        router.pathname === pathname;

    const [session, loading] = useSession();

    console.log("session in front header");
    console.log(session);


    let left = (
        <div className="left">
            <Link href="/">
                <h3 className="bold" >
                    Feed
                </h3>
            </Link>
            <style jsx>{`
        .bold {
          font-weight: bold;
        }

        a {
          text-decoration: none;
          color: #000;
          display: inline-block;
        }

        .left a[data-active='true'] {
          color: gray;
        }

        a + a {
          margin-left: 1rem;
        }
      `}</style>
        </div>
    );

    let right = null;

    if (loading) {
        left = (
            <div className="left">
                <Link href="/">
                    <a className="bold" data-active={isActive('/')}>
                        Feed
                    </a>
                </Link>
                <style jsx>{`
          .bold {
            font-weight: bold;
          }

          a {
            text-decoration: none;
            color: #000;
            display: inline-block;
          }

          .left a[data-active='true'] {
            color: gray;
          }

          a + a {
            margin-left: 1rem;
          }
        `}</style>
            </div>
        );
        right = (
            <div className="right">
                <p>Validating session ...</p>
                <style jsx>{`
          .right {
            margin-left: auto;
          }
        `}</style>
            </div>
        );
    }

    if (!session) {
        right = (
            <div className="right">
                <Link href="/api/auth/signin">
                    <a data-active={isActive('/signup')}>Log in</a>
                </Link>
                <button onClick={() => handleClick()}>
                    <p>Log in with Metamask</p>
                </button>
                <style jsx>{`
          a {
            text-decoration: none;
            color: #000;
            display: inline-block;
          }

          a + a {
            margin-left: 1rem;
          }

          .right {
            margin-left: auto;
          }

          .right a {
            border: 1px solid black;
            padding: 0.5rem 1rem;
            border-radius: 3px;
          }
        `}</style>
            </div>
        );
    }
    if (session) {
        left = (
            <div className="left">

                <style jsx>{`
          .bold {
            font-weight: bold;
          }

          a {
            text-decoration: none;
            color: #000;
            display: inline-block;
          }

          .left a[data-active='true'] {
            color: gray;
          }

          a + a {
            margin-left: 1rem;
          }
        `}</style>
            </div>
        );
        right = (
            <div className="right">
                <p>
                    {session.name} ({session.email})
                </p>

                <button onClick={() => signOut()}>
                    <a>Log out</a>
                </button>
                <style jsx>{`
          a {
            text-decoration: none;
            color: #000;
            display: inline-block;
          }

          p {
            display: inline-block;
            font-size: 13px;
            padding-right: 1rem;
          }

          a + a {
            margin-left: 1rem;
          }

          .right {
            margin-left: auto;
          }

          .right a {
            border: 1px solid black;
            padding: 0.5rem 1rem;
            border-radius: 3px;
          }

          button {
            border: none;
          }
        `}</style>
            </div>
        );
    }

    return (
        <nav>
            {left}
            {right}
            <style jsx>{`
        nav {
          display: flex;
          padding: 2rem;
          align-items: center;
        }
      `}</style>
        </nav>
    );
};

export default Header;