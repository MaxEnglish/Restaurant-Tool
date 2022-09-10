import React from 'react';
import { useState, useEffect, useReducer } from 'react';
import { Link } from 'react-router-dom'
import BigButton from '../components/big-button';
import Table from '../components/table'
import HomeButton from '../components/home-button';
import '../css/create-check.css';
import '../css/guest-on-check.css';
import { FaSadTear } from 'react-icons/fa';
import { TiDelete } from 'react-icons/ti'
var API = require('../Controllers');

function CreateCheck() {

    const [tab, setTab] = useState("tables");
    const [tables, setTables] = useState([]);   //array of table elements, not objects
    const [table, setTable] = useState();       //represents current table
    const [confirm, setConfirm] = useState(false);  //used for home button confirm
    const [moving, setMoving] = useState(false);    //true when moving orders
    const [clicked, setClicked] = useState({ order: '', amount: 0, index: -1, guestIndex: -1 });    //means of storing data when something is clicked then deleted or is no longer easy to reference
    const [percenting, setPercenting] = useState('');   //true when splitting an order by percent
    const [splitWith, setSplitWith] = useState([]);     //array of customers who are splitting the bill
    const [reviewIndex, setReviewIndex] = useState(0);

    const [, forceUpdate] = useReducer(x => x + 1, 0);  //forces the rerendering of an element

    const getTables = () => {       //returns table data from the backend
        API.getTables().then(
            response => response.json()).then(
                data => {
                    setTables(data);
                })
    }

    const getTable = () => {        //returns a specific table
        API.getTable().then(
            response => response.json()).then(
                data => {
                    setTable(findOldTable(table.name, data))
                }
            )
    }

    useEffect(() => {
        getTables()
    }, []);

    function GuestOnCheck(props) {
        return (
            <div
                className={(percenting.length > 25 && checkIfContains(props.parentIndex, splitWith)) ? 'check-box backgrounded-blue selected' : moving || (percenting.length > 25 && !checkIfContains(props.parentIndex, splitWith)) ? 'check-box selected' : 'check-box'}
                onClick={props.onClick}
            >
                <div className='check-price'>Price: {props.price}</div>
                {props.orders.map((order, index) => (
                    <div
                        className={(clicked.order === order && index === clicked.index && props.parentIndex === clicked.guestIndex) ? 'check-order-box backgrounded-red' : 'check-order-box'}
                        key={index}
                        onClick={() => {
                            var amount = props.amounts[index];
                            var guestIndex = props.parentIndex;
                            if (!moving && percenting.length < 1) {
                                setMoving(true);
                                setClicked({ order, amount, index, guestIndex });
                            } else if (percenting.length > 0 && percenting.length < 25) {
                                setClicked({ order, amount, index, guestIndex });
                                setPercenting("Select the customers you'd like to split between")
                            }
                        }}
                    >{props.amounts[index] + " " + order.name}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <HomeButton tab={tab} onClick={() => { setConfirm(true) }} />
            {confirm && (
                <>
                    <div className='outside-container'></div>
                    <div className='buttons-wrapper'>
                        <div>Are you sure you want to go home? Your progress will not be saved</div>
                        <Link to="/">
                            <button className='yes-button'>Yes</button>
                        </Link>
                        <button className='no-button' onClick={() => { setConfirm(false) }}>No</button>
                    </div>
                </>
            )}
            {tab === 'tables' ? (
                tables.length === 0 ? (
                    <div className='no-orders'>There are currently no tables with orders submitted <FaSadTear /> To add a new table, go to "Take Order" on the Home page</div>
                ) : (
                    <div className='tables-container'>
                        {tables.map((myTable, index) => (    //maps through tables constant and creates numbered table elements
                            <Table key={index}
                                name={"Table " + myTable.name}
                                onClick={() => {
                                    setTable(myTable);
                                    setTab('options');
                                }}
                            />
                        ))}
                    </div>
                )) : null}
            {tab === 'options' && (
                <div className='outer-container'>
                    <BigButton name='Single Check' onClick={() => { setTab('single-check') }} />
                    <BigButton name='Split Check' onClick={() => { setTab('split-check') }} />
                </div>
            )}
            {tab === 'split-check' && (
                <div className='outer-container'>
                    <div className='check-headers'>
                        <button
                            className='check-header1'
                            onClick={() => {
                                setPercenting('Select an item to split');
                            }}
                        >Split an item via percent
                        </button>
                        <button
                            className='check-header4'
                            onClick={() => {
                                if (!percenting && !moving) {
                                    getTable(table.name);
                                }
                            }}
                        >Reset changes
                        </button>
                        <p className='check-header2'>Click on a food item to move it</p>
                        <p className='check-header3'>Orders</p>
                    </div>
                    <div className='check-inner-container'>
                        {table.guests.map((guest, index) => (      //mapping the table's guests
                            <GuestOnCheck key={index}
                                orders={guest.orders}
                                amounts={guest.amounts}
                                parentIndex={index}
                                price={calcPrice(guest.orders, guest.amounts)}
                                onClick={() => {
                                    if (moving && index !== clicked.guestIndex) {
                                        let tempTable = table;
                                        if (clicked.amount <= 1) {     //handle removing an order after a move
                                            tempTable.guests[clicked.guestIndex].orders.splice(clicked.index, 1);
                                            tempTable.guests[clicked.guestIndex].amounts.splice(clicked.index, 1);
                                        } else {
                                            tempTable.guests[clicked.guestIndex].amounts[clicked.index] = (parseFloat(tempTable.guests[clicked.guestIndex].amounts[clicked.index]) - 1.0).toFixed(2);
                                        }

                                        if (hasOrder(tempTable.guests[index].orders, clicked.order)) {      //handle adding an order after a move
                                            if (clicked.amount < 1) {
                                                tempTable.guests[index].amounts[ordersToNames(tempTable.guests[index].orders).indexOf(clicked.order.name)] = parseFloat(tempTable.guests[index].amounts[ordersToNames(tempTable.guests[index].orders).indexOf(clicked.order.name)]) + parseFloat(clicked.amount);
                                            } else {
                                                tempTable.guests[index].amounts[ordersToNames(tempTable.guests[index].orders).indexOf(clicked.order.name)]++;
                                            }
                                        } else {
                                            tempTable.guests[index].orders.push(clicked.order);
                                            if (clicked.amount < 1) {
                                                tempTable.guests[index].amounts.push(clicked.amount);
                                            } else {
                                                tempTable.guests[index].amounts.push(1);
                                            }
                                        }
                                        setTable(tempTable)
                                        setMoving(false);
                                        setClicked({ order: '', amount: 0, index: -1, guestIndex: -1 })
                                    } else if (percenting.length > 25 && !checkIfContains(index, splitWith)) {      //handle splitting check
                                        let tempSplitWith = splitWith;
                                        tempSplitWith.push(index)
                                        setSplitWith(tempSplitWith);
                                        forceUpdate();
                                    } else if (percenting.length > 25 && checkIfContains(index, splitWith)) {
                                        let tempSplitWith = splitWith;
                                        tempSplitWith.splice(tempSplitWith.indexOf(index), 1)
                                        setSplitWith(tempSplitWith);
                                        forceUpdate();
                                    }
                                }}
                            />
                        ))}
                    </div>
                    <button
                    className='present'
                    onClick={()=> {
                        if (!percenting && !moving) {
                            setReviewIndex(0);
                            setTab("customer-review")
                        }
                    }}
                    >Present to customer
                    </button>
                </div>
            )}
            {tab === "customer-review" && (
                <div>
                    {table.guests[reviewIndex].orders.map((order, index) => (
                        <div key={index}>{order.name}</div>
                    ))}
                </div>
            )}
            {moving && (
                <>
                    <div className='cancel-btn' onClick={() => { setMoving(false); setClicked({ order: '', amount: 0, index: -1, guestIndex: -1 }) }}><TiDelete size={35} title="Cancel" /></div>
                    <div className='moving-screen'></div>
                    <p className='moving-msg'>Click where you'd like to move selected order</p>
                </>
            )}
            {percenting.length > 0 && (
                <>
                    <button
                        className='done-button'
                        onClick={() => {
                            if (clicked.index === -1) {
                                setPercenting('');
                            } else {
                                var splitLength = splitWith.length;
                                var splitPrice = clicked.order.price / splitLength;
                                var tempTable = table;
                                tempTable.guests[clicked.guestIndex].orders.splice(clicked.index, 1);
                                tempTable.guests[clicked.guestIndex].amounts.splice(clicked.index, 1);
                                splitWith.forEach((guestIndex) => {
                                    if (hasOrder(tempTable.guests[guestIndex].orders, clicked.order)) {
                                        tempTable.guests[guestIndex].amounts[ordersToNames(tempTable.guests[guestIndex].orders).indexOf(clicked.order.name)] = (parseFloat(tempTable.guests[guestIndex].amounts[ordersToNames(tempTable.guests[guestIndex].orders).indexOf(clicked.order.name)]) + (parseFloat(clicked.amount / splitLength))).toFixed(2);
                                        tempTable.guests[guestIndex].orders[ordersToNames(tempTable.guests[guestIndex].orders).indexOf(clicked.order.name)].price += (splitPrice);
                                    } else {
                                        tempTable.guests[guestIndex].orders.push(clicked.order);
                                        tempTable.guests[guestIndex].orders[tempTable.guests[guestIndex].orders.length - 1].price = (parseFloat(tempTable.guests[guestIndex].orders[tempTable.guests[guestIndex].orders.length - 1].price) / splitLength).toFixed(2);
                                        tempTable.guests[guestIndex].amounts.push((clicked.amount / splitLength).toFixed(2));
                                    }
                                })
                                setTable(tempTable);
                                setSplitWith([]);
                                setClicked({ order: '', amount: 0, index: -1, guestIndex: -1 })
                                setPercenting('');
                            }
                        }}
                    >Done
                    </button>
                    <div className='cancel-btn' onClick={() => { setPercenting(''); setClicked({ order: '', amount: 0, index: -1, guestIndex: -1 }) }}><TiDelete size={35} title="Cancel" /></div>
                    <div className='moving-screen'></div>
                    <p className='moving-msg'>{percenting}</p>

                </>
            )}
        </>
    )
}

export default CreateCheck;


const hasOrder = (orders, item) => {
    if (orders.filter(order=>order.name === item.name).length > 0) {
        return true;
    } else {
        return false
    }
}

const ordersToNames = (orders) => {
    var newArr = [];
    orders.forEach((order) => {
        newArr.push(order.name);
    })
    return newArr;
}

const checkIfContains = (guestIndex, guestIndeces) => {
    if (guestIndeces.filter(guestI=>guestI === guestIndex).length > 0) {
        return true;
    } else {
        return false
    }
}

const findOldTable = (newTableName, oldTables) => {
    var temp = oldTables.filter(oldTable=> oldTable.name === newTableName);
    if (temp.length > 0) {
        return temp[0];
    } else {
        return null;
    }
}

const calcPrice = (orders, amounts) => {
    var total = 0.0;
    for (let i = 0; i < orders.length; i++) {
        total += parseFloat(orders[i].price) * parseFloat(amounts[i])
    }
    return "$" + (total).toFixed(2);
}