import React from 'react';
import { Link } from 'react-router-dom';

export const Header = () => {
    return(
        <div>
            <Link to='/'>Top</Link>
            <ul>
                <li><Link to='/ct'>テキスト作成</Link></li>
            </ul>
        </div>
    )
}