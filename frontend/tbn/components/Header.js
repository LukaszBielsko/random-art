import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

const Header = (props) => {

    const Navbar = styled.div`
        width: 100%;
        padding: 20px;
        color: white;
        background: black;
        display: flex;
        flex-flow: row;
        justify-content: space-around;
        .logo {
            /* flex: 1; */
            margin-right: 1rem;
            margin-left: 1rem;
            text-transform: uppercase;
            font-size: 3rem;
            transform: skew(-7deg);
            border-left: 3px solid white;
            border-right: 3px solid white;
            padding: 0px 20px 0px 20px;
            a { 
                color: white;
                text-decoration: none;
            }
        }
        .nav-items {
            display: flex;
            align-items: flex-end;
            flex-grow: 1;
            padding-left: 50px;
            text-transform: uppercase;
            font-size: 2.5rem;
            a{
                margin-left: 10px;
                color: white;
                text-decoration: none;
            }
        }
        .search-cart {
            display: flex;
            align-items: flex-end;
            display: flex;
            flex-direction: row;
            input {
                padding-left: 10px;
                font-size: 2rem;
                padding-top: 5px;
                padding-bottom: 5px;
            }
        }
    `



    return (
        <Navbar >
            <div className="logo">
                <Link href="/index">
                    <a>logo</a>
                </Link>
            </div>
            <div className="nav-items">
                <Link href="/sell">
                    <a>Sell</a>
                </Link>
                <Link href="/orders">
                    <a>Buy</a>
                </Link>
                <Link href="/account">
                    <a>SthElse</a>
                </Link>
                <Link href="/test">
                    <a>Test</a>
                </Link>
            </div>
            <div className="search-cart">
                <div className="search-box">
                    <input type="text" placeholder="search" />
                </div>
                <div className="cart">
                    {/* should be an icon */}
                    <i className="fas fa-shopping-cart"></i> 
                    cart
                </div>
            </div>
        </Navbar>
    );
};

export default Header;  