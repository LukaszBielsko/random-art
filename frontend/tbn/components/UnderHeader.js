import React from 'react';
import styled from 'styled-components';

const UnderHeader = (props) => {

    const UnderHeader = styled.div`
        width: 100%;
        background-color: #ebedee;
        border-top: 2px solid white;
        border-bottom: 2px solid white;
        display: flex;
        justify-content: space-evenly;

        section {
            padding: 5px;
        }
        `

    return (
        <UnderHeader>
            <section>
                some marketing info here 
            </section>
            <section>
                some marketing info here
            </section>
            <section>
                some marketing info here
            </section>
        </UnderHeader>
    );
};

export default UnderHeader;