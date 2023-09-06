import React, {useEffect} from "react";


const Button = ()=>{

    useEffect(()=>{
        console.log("[react-tsup-package] button started")
    },[])
    return (<button type="button">Hello!222</button>)
}

export { Button }